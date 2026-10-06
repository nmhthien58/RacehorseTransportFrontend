-- =====================================================================================
-- SCRIPT 04: REVIEW FIXES v3 (chạy SAU script 01, 02, 03)
-- System: Cross-Border Racehorse Transport System (SWP391 - Group 5)
-- Nội dung:
--   A. Bổ sung ràng buộc toàn vẹn còn thiếu (UNIQUE / CHECK)
--   B. Đồng bộ vòng đời Status với Business Flow 1-6 và màn hình Figma
--   C. Bổ sung danh mục quy định giấy tờ theo quốc gia (Scope: Transport Specialist)
--   D. Bổ sung bảng giá tổng hợp (pricing.PriceItems) + thủ tục lập báo giá
--   E. Sửa lỗi thủ tục chốt KPI (bỏ sót sự cố đã Resolved)
--   G. Thêm fleet.TripCrew thay cho Trips.DriverID / EscortID (một chuyến nhiều tài xế, nhiều người áp tải)
--   F. Bỏ Trips.BookingID: quan hệ Đơn - Chuyến là nhiều-nhiều qua TripHorses (cho phép ghép đơn)
-- Script chạy lại nhiều lần được (idempotent).
-- =====================================================================================

USE CrossBorderRacehorseTransportDB;
GO

-- Bắt buộc cho filtered index (SSMS bật sẵn, sqlcmd thì không)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'pricing')
    EXEC('CREATE SCHEMA pricing AUTHORIZATION dbo;');
GO

-- =====================================================================================
-- A + B.1  BOOKING
-- =====================================================================================

-- Vòng đời đơn: thêm Assigned (đã phân công), Completed (đã nghiệm thu), Expired (quá SLA 48h)
ALTER TABLE booking.BookingRequests DROP CONSTRAINT IF EXISTS CK_booking_BookingRequests_Status;
ALTER TABLE booking.BookingRequests ADD CONSTRAINT CK_booking_BookingRequests_Status
    CHECK (Status IN ('Submitted', 'Approved', 'Assigned', 'Completed', 'Rejected', 'Expired', 'Cancelled'));
GO

-- Ngày giao phải sau ngày khởi hành
ALTER TABLE booking.BookingRequests DROP CONSTRAINT IF EXISTS CK_booking_BookingRequests_Dates;
ALTER TABLE booking.BookingRequests ADD CONSTRAINT CK_booking_BookingRequests_Dates
    CHECK (DeliveryDate > DepartureDate);
GO

-- Các cột đầu vào của công thức tính giá
IF COL_LENGTH('booking.BookingRequests', 'TransportMode') IS NULL
    ALTER TABLE booking.BookingRequests ADD
        TransportMode VARCHAR(10) NOT NULL CONSTRAINT DF_booking_BookingRequests_Mode DEFAULT 'Ground'
            CONSTRAINT CK_booking_BookingRequests_Mode CHECK (TransportMode IN ('Ground', 'Air')),
        DistanceKm INT NULL CONSTRAINT CK_booking_BookingRequests_Distance CHECK (DistanceKm > 0),
        IsExpress BIT NOT NULL CONSTRAINT DF_booking_BookingRequests_Express DEFAULT 0,
        RequiresClimateControl BIT NOT NULL CONSTRAINT DF_booking_BookingRequests_Climate DEFAULT 0,
        DeclaredValue DECIMAL(18,2) NULL; -- NULL = khách không mua bảo hiểm
GO

-- Hạng chuồng của từng con ngựa trong đơn (hệ số nhân cước)
IF COL_LENGTH('booking.BookingHorses', 'StallClass') IS NULL
    ALTER TABLE booking.BookingHorses ADD
        StallClass VARCHAR(10) NOT NULL CONSTRAINT DF_booking_BookingHorses_Stall DEFAULT 'Shared'
            CONSTRAINT CK_booking_BookingHorses_Stall CHECK (StallClass IN ('Shared', 'Comfort', 'Private'));
GO

-- =====================================================================================
-- A + B.2  CLEARANCE
-- =====================================================================================

-- Giấy tờ thú y có hạn hiệu lực; Figma giới hạn khách nộp lại tối đa 3 lần
IF COL_LENGTH('clearance.DossierDocuments', 'ExpiryDate') IS NULL
    ALTER TABLE clearance.DossierDocuments ADD
        ExpiryDate DATE NULL,
        RejectionCount INT NOT NULL CONSTRAINT DF_clearance_DossierDocuments_RejCount DEFAULT 0
            CONSTRAINT CK_clearance_DossierDocuments_RejCount CHECK (RejectionCount BETWEEN 0 AND 3);
GO

-- C. Bảng 16: Quy định giấy tờ bắt buộc theo từng quốc gia (Quarantine Rules DB trên Figma)
IF OBJECT_ID('clearance.CountryDocRequirements', 'U') IS NULL
CREATE TABLE clearance.CountryDocRequirements (
    RequirementID INT IDENTITY(1,1) CONSTRAINT PK_clearance_CountryDocRequirements PRIMARY KEY,
    CountryCode CHAR(2) NOT NULL,
    Direction VARCHAR(10) NOT NULL CONSTRAINT CK_clearance_CountryReq_Direction CHECK (Direction IN ('Export', 'Import')),
    DocTypeID INT NOT NULL,
    ValidityDays INT NULL, -- Giấy phải được cấp trong vòng N ngày trước ngày đi
    IsMandatory BIT NOT NULL CONSTRAINT DF_clearance_CountryReq_Mandatory DEFAULT 1,
    RegulationNote NVARCHAR(255) NULL,
    CONSTRAINT UQ_clearance_CountryReq UNIQUE (CountryCode, Direction, DocTypeID),
    CONSTRAINT FK_clearance_CountryReq_DocType FOREIGN KEY (DocTypeID) REFERENCES clearance.DocumentTypes(DocTypeID)
);
GO

-- =====================================================================================
-- A + B.3  FLEET
-- =====================================================================================

-- Figma có cả xe thùng lẫn khoang bay (Air Stall) -> chuẩn hóa loại phương tiện
ALTER TABLE fleet.TransportAssets DROP CONSTRAINT IF EXISTS CK_fleet_Assets_Type;
ALTER TABLE fleet.TransportAssets ADD CONSTRAINT CK_fleet_Assets_Type
    CHECK (AssetType IN ('HorseTruck_AirSuspension', 'HorseVan', 'AirStall'));
GO

-- Flow 3: Coordinator dự thảo kế hoạch -> Manager duyệt -> mới thành chuyến chính thức
ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS CK_fleet_Trips_Status;
ALTER TABLE fleet.Trips ADD CONSTRAINT CK_fleet_Trips_Status
    CHECK (OverallStatus IN ('Draft', 'PendingApproval', 'Scheduled', 'InTransit', 'EmergencyRerouting',
                             'ArrivedDestination', 'Completed', 'Cancelled'));
ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS DF_fleet_Trips_Status;
ALTER TABLE fleet.Trips ADD CONSTRAINT DF_fleet_Trips_Status DEFAULT 'Draft' FOR OverallStatus;
ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS CK_fleet_Trips_Dates;
ALTER TABLE fleet.Trips ADD CONSTRAINT CK_fleet_Trips_Dates CHECK (PlannedEndDate > PlannedStartDate);
GO

IF COL_LENGTH('fleet.Trips', 'PlannedByUserID') IS NULL
    ALTER TABLE fleet.Trips ADD
        PlannedByUserID INT NULL CONSTRAINT FK_fleet_Trips_Planner REFERENCES auth.Users(UserID),   -- Coordinator lập kế hoạch
        ApprovedByUserID INT NULL CONSTRAINT FK_fleet_Trips_Approver REFERENCES auth.Users(UserID), -- Manager duyệt kế hoạch
        ApprovedAt DATETIMEOFFSET NULL,
        PlanRejectionCount INT NOT NULL CONSTRAINT DF_fleet_Trips_RejCount DEFAULT 0
            CONSTRAINT CK_fleet_Trips_RejCount CHECK (PlanRejectionCount BETWEEN 0 AND 3),
        PlanRejectionReason NVARCHAR(500) NULL;
GO

-- Quan hệ Đơn - Chuyến là NHIỀU - NHIỀU: một chuyến ghép ngựa của nhiều đơn, một đơn có thể chia nhiều chuyến.
-- Bảng nối đã có sẵn: Trips <- TripHorses -> BookingHorses -> BookingRequests.
-- Vì vậy bỏ cột Trips.BookingID (cột này ép mỗi chuyến chỉ thuộc đúng một đơn).
IF COL_LENGTH('fleet.Trips', 'BookingID') IS NOT NULL
BEGIN
    ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS FK_fleet_Trips_Booking;
    ALTER TABLE fleet.Trips DROP COLUMN BookingID;
END
GO

-- Bảng 18: Nhân sự của chuyến. Quan hệ Chuyến - Nhân viên là NHIỀU - NHIỀU:
-- một chuyến có nhiều tài xế (thay ca) và nhiều người áp tải (1 groom / 3 ngựa),
-- một nhân viên đi nhiều chuyến theo thời gian. Thay cho 2 cột Trips.DriverID và Trips.EscortID.
IF OBJECT_ID('fleet.TripCrew', 'U') IS NULL
CREATE TABLE fleet.TripCrew (
    TripCrewID INT IDENTITY(1,1) CONSTRAINT PK_fleet_TripCrew PRIMARY KEY,
    TripID INT NOT NULL,
    UserID INT NOT NULL,
    CrewRole VARCHAR(10) NOT NULL CONSTRAINT CK_fleet_TripCrew_Role CHECK (CrewRole IN ('Driver', 'Escort')),
    IsLead BIT NOT NULL CONSTRAINT DF_fleet_TripCrew_Lead DEFAULT 0, -- Tài xế chính / trưởng nhóm áp tải
    Duty NVARCHAR(200) NULL,                                          -- Ví dụ: nhận ngựa tại trại, chăm sóc trên chuyến bay
    CONSTRAINT UQ_fleet_TripCrew UNIQUE (TripID, UserID, CrewRole),
    CONSTRAINT FK_fleet_TripCrew_Trip FOREIGN KEY (TripID) REFERENCES fleet.Trips(TripID),
    CONSTRAINT FK_fleet_TripCrew_User FOREIGN KEY (UserID) REFERENCES auth.Users(UserID)
);
GO

-- Chuyển dữ liệu cũ sang TripCrew rồi bỏ 2 cột (dùng SQL động vì sau lần chạy đầu 2 cột không còn)
IF COL_LENGTH('fleet.Trips', 'DriverID') IS NOT NULL
BEGIN
    EXEC(N'INSERT INTO fleet.TripCrew (TripID, UserID, CrewRole, IsLead)
           SELECT TripID, DriverID, ''Driver'', 1 FROM fleet.Trips
           UNION ALL
           SELECT TripID, EscortID, ''Escort'', 1 FROM fleet.Trips;');
    ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS FK_fleet_Trips_Driver;
    ALTER TABLE fleet.Trips DROP CONSTRAINT IF EXISTS FK_fleet_Trips_Escort;
    ALTER TABLE fleet.Trips DROP COLUMN DriverID, EscortID;
END
GO

-- View tra nhanh: chuyến nào chở đơn nào, bao nhiêu ngựa
CREATE OR ALTER VIEW fleet.vw_TripBookings AS
SELECT th.TripID, bh.BookingID, COUNT(*) AS HorseCount
FROM fleet.TripHorses th
JOIN booking.BookingHorses bh ON bh.BookingHorseID = th.BookingHorseID
GROUP BY th.TripID, bh.BookingID;
GO

-- Hai con ngựa không thể chung một ô chuồng trong cùng chuyến
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_fleet_TripHorses_Stall')
    ALTER TABLE fleet.TripHorses ADD CONSTRAINT UQ_fleet_TripHorses_Stall UNIQUE (TripID, StallSlotNumber);
GO

-- Thứ tự mốc không trùng trong các mốc còn hiệu lực (mốc bị nắn tuyến có IsActive = 0)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_fleet_RouteCheckpoints_Sequence')
    CREATE UNIQUE INDEX UQ_fleet_RouteCheckpoints_Sequence
        ON fleet.RouteCheckpoints (TripID, SequenceOrder) WHERE IsActive = 1;
GO

-- =====================================================================================
-- A + B.4  INCIDENT
-- =====================================================================================

-- Manager có thể từ chối phương án -> Coordinator đề xuất lại
ALTER TABLE incident.TripIncidents DROP CONSTRAINT IF EXISTS CK_incident_Incidents_Status;
ALTER TABLE incident.TripIncidents ADD CONSTRAINT CK_incident_Incidents_Status
    CHECK (Status IN ('Reported', 'PlanProposed', 'Approved', 'Rejected', 'Resolved'));

-- Bổ sung loại sự cố có trên màn hình Emergency Incident Report
ALTER TABLE incident.TripIncidents DROP CONSTRAINT IF EXISTS CK_incident_Incidents_Type;
ALTER TABLE incident.TripIncidents ADD CONSTRAINT CK_incident_Incidents_Type
    CHECK (IncidentType IN ('MechanicalBreakdown', 'BorderCongestion', 'EquineHealthIssue', 'Weather',
                            'ClimateControlFailure', 'CustomsHold', 'Other'));
GO

IF COL_LENGTH('incident.TripIncidents', 'Severity') IS NULL
    ALTER TABLE incident.TripIncidents ADD
        Severity VARCHAR(10) NOT NULL CONSTRAINT DF_incident_Incidents_Severity DEFAULT 'Moderate'
            CONSTRAINT CK_incident_Incidents_Severity CHECK (Severity IN ('Minor', 'Moderate', 'Major', 'Critical')),
        AffectedTripHorseID INT NULL CONSTRAINT FK_incident_Incidents_TripHorse REFERENCES fleet.TripHorses(TripHorseID),
        ResolvedAt DATETIMEOFFSET NULL;
GO

-- =====================================================================================
-- A.5  ACCEPTANCE: mỗi chuyến chỉ có đúng 1 biên bản e-POD (ERD vẽ 1-1 nhưng DB chưa chặn)
-- =====================================================================================
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_acceptance_Handover_Trip')
    ALTER TABLE acceptance.HandoverAcceptances ADD CONSTRAINT UQ_acceptance_Handover_Trip UNIQUE (TripID);
GO

-- =====================================================================================
-- D. PRICING (BẢNG GIÁ)
-- =====================================================================================

-- Bảng 17: Bảng giá tổng hợp. Mỗi dòng là MỘT khoản giá: cước tuyến, hệ số hạng chuồng,
-- phụ phí, chiết khấu, phí cố định, phí áp tải, bảo hiểm.
--   TransportMode  NULL = áp dụng cho cả đường bộ và đường bay
--   DestCountryCode NULL = áp dụng cho mọi nước đến (dòng có nước cụ thể được ưu tiên hơn)
DROP TABLE IF EXISTS booking.BookingCharges; -- các bản script trước
DROP TABLE IF EXISTS pricing.PriceRules;
DROP TABLE IF EXISTS pricing.RouteRates;
GO

IF OBJECT_ID('pricing.PriceItems', 'U') IS NULL
CREATE TABLE pricing.PriceItems (
    PriceItemID INT IDENTITY(1,1) CONSTRAINT PK_pricing_PriceItems PRIMARY KEY,
    Category VARCHAR(20) NOT NULL CONSTRAINT CK_pricing_PriceItems_Category
        CHECK (Category IN ('Freight', 'StallClass', 'Surcharge', 'Discount', 'Clearance', 'Escort', 'Insurance')),
    ItemCode VARCHAR(30) NOT NULL,
    ItemName NVARCHAR(100) NOT NULL,
    TransportMode VARCHAR(10) NULL CONSTRAINT CK_pricing_PriceItems_Mode CHECK (TransportMode IN ('Ground', 'Air')),
    DestCountryCode CHAR(2) NULL,
    CalcType VARCHAR(20) NOT NULL CONSTRAINT CK_pricing_PriceItems_CalcType
        CHECK (CalcType IN ('PerHorse', 'PerKmPerHorse', 'Multiplier', 'Percent', 'PerBooking', 'PerGroom', 'PerGroomDay')),
    Value DECIMAL(18,4) NOT NULL,
    MinHorses INT NULL, -- Chỉ dùng cho các bậc chiết khấu số lượng
    IsActive BIT NOT NULL CONSTRAINT DF_pricing_PriceItems_Active DEFAULT 1,
    CONSTRAINT UQ_pricing_PriceItems UNIQUE (ItemCode, TransportMode, DestCountryCode)
);
GO

-- Chi tiết báo giá của đơn: lưu nguyên các dòng dưới dạng JSON ngay trong đơn (không cần bảng riêng)
IF COL_LENGTH('booking.BookingRequests', 'QuoteBreakdown') IS NULL
    ALTER TABLE booking.BookingRequests ADD QuoteBreakdown NVARCHAR(MAX) NULL;
GO

-- ---------- Seed bảng giá ----------
IF NOT EXISTS (SELECT 1 FROM pricing.PriceItems)
INSERT INTO pricing.PriceItems (Category, ItemCode, ItemName, TransportMode, DestCountryCode, CalcType, Value, MinHorses) VALUES
-- Cước tuyến đường bay (USD / ngựa)
('Freight', 'FREIGHT', N'Zone A - Đông Nam Á (Thái Lan)',        'Air', 'TH', 'PerHorse', 3000, NULL),
('Freight', 'FREIGHT', N'Zone A - Đông Nam Á (Singapore)',       'Air', 'SG', 'PerHorse', 3000, NULL),
('Freight', 'FREIGHT', N'Zone A - Đông Nam Á (Malaysia)',        'Air', 'MY', 'PerHorse', 3000, NULL),
('Freight', 'FREIGHT', N'Zone B - Đông Á (Hong Kong)',           'Air', 'HK', 'PerHorse', 5000, NULL),
('Freight', 'FREIGHT', N'Zone B - Đông Á (Hàn Quốc)',            'Air', 'KR', 'PerHorse', 5000, NULL),
('Freight', 'FREIGHT', N'Zone B - Đông Á (Nhật Bản)',            'Air', 'JP', 'PerHorse', 5000, NULL),
('Freight', 'FREIGHT', N'Zone C - Trung Đông (UAE)',             'Air', 'AE', 'PerHorse', 6500, NULL),
('Freight', 'FREIGHT', N'Zone C - Châu Úc (Úc)',                 'Air', 'AU', 'PerHorse', 6500, NULL),
('Freight', 'FREIGHT', N'Zone D - Châu Âu (Pháp)',               'Air', 'FR', 'PerHorse', 8000, NULL),
('Freight', 'FREIGHT', N'Zone D - Châu Âu (Anh)',                'Air', 'GB', 'PerHorse', 8000, NULL),
('Freight', 'FREIGHT', N'Zone D - Châu Âu (Đức)',                'Air', 'DE', 'PerHorse', 8000, NULL),
('Freight', 'FREIGHT', N'Zone E - Châu Mỹ (Mỹ)',                 'Air', 'US', 'PerHorse', 10500, NULL),
-- Cước tuyến đường bộ (USD / km / ngựa)
('Freight', 'FREIGHT', N'Zone G1 - Đường bộ (Campuchia)',        'Ground', 'KH', 'PerKmPerHorse', 1.00, NULL),
('Freight', 'FREIGHT', N'Zone G1 - Đường bộ (Lào)',              'Ground', 'LA', 'PerKmPerHorse', 1.00, NULL),
('Freight', 'FREIGHT', N'Zone G1 - Đường bộ (Thái Lan)',         'Ground', 'TH', 'PerKmPerHorse', 1.00, NULL),
('Freight', 'FREIGHT', N'Zone G1 - Đường bộ (Trung Quốc)',       'Ground', 'CN', 'PerKmPerHorse', 1.00, NULL),
-- Hệ số hạng chuồng
('StallClass', 'STALL_SHARED',  N'Chuồng ghép (Shared) - 3 ngựa / pallet',   NULL, NULL, 'Multiplier', 1.00, NULL),
('StallClass', 'STALL_COMFORT', N'Chuồng rưỡi (Comfort) - 2 ngựa / pallet',  NULL, NULL, 'Multiplier', 1.40, NULL),
('StallClass', 'STALL_PRIVATE', N'Chuồng riêng (Private) - 1 ngựa / pallet', NULL, NULL, 'Multiplier', 2.20, NULL),
-- Phụ phí trên cước
('Surcharge', 'SUR_FUEL',    N'Phụ phí nhiên liệu',                          NULL, NULL, 'Percent', 8,  NULL),
('Surcharge', 'SUR_CLIMATE', N'Phụ phí khoang điều hòa / chăm sóc đặc biệt', NULL, NULL, 'Percent', 10, NULL),
('Surcharge', 'SUR_EXPRESS', N'Phụ phí gấp (khởi hành dưới 7 ngày)',         NULL, NULL, 'Percent', 20, NULL),
-- Chiết khấu số lượng trên cước
('Discount', 'DISC_VOL_2', N'Chiết khấu 2-3 ngựa',  NULL, NULL, 'Percent', 5,  2),
('Discount', 'DISC_VOL_4', N'Chiết khấu 4-6 ngựa',  NULL, NULL, 'Percent', 10, 4),
('Discount', 'DISC_VOL_7', N'Chiết khấu từ 7 ngựa', NULL, NULL, 'Percent', 15, 7),
-- Thủ tục, thông quan, kiểm dịch
('Clearance', 'FEE_DOCS',       N'Phí hồ sơ & chứng nhận sức khỏe xuất khẩu', NULL,     NULL, 'PerHorse',   350,  NULL),
('Clearance', 'FEE_CLEARANCE',  N'Phí phục vụ sân bay & thông quan',          'Air',    NULL, 'PerHorse',   600,  NULL),
('Clearance', 'FEE_CLEARANCE',  N'Phí thông quan cửa khẩu',                   'Ground', NULL, 'PerHorse',   250,  NULL),
('Clearance', 'FEE_QUARANTINE', N'Phí kiểm dịch nước đến (mức chuẩn)',        'Air',    NULL, 'PerHorse',   700,  NULL),
('Clearance', 'FEE_QUARANTINE', N'Phí kiểm dịch Nhật Bản (cách ly dài)',      'Air',    'JP', 'PerHorse',   2500, NULL),
('Clearance', 'FEE_QUARANTINE', N'Phí kiểm dịch Úc (cách ly dài)',            'Air',    'AU', 'PerHorse',   2500, NULL),
('Clearance', 'FEE_QUARANTINE', N'Phí kiểm dịch Trung Quốc',                  'Ground', 'CN', 'PerHorse',   700,  NULL),
('Clearance', 'FEE_PICKUP',     N'Phí điều xe đến điểm nhận',                 'Ground', NULL, 'PerBooking', 100,  NULL),
-- Áp tải (1 groom / 3 ngựa)
('Escort', 'ESCORT', N'Groom bay kèm',                     'Air',    NULL, 'PerGroom',    900, NULL),
('Escort', 'ESCORT', N'Groom đi kèm đường bộ (theo ngày)', 'Ground', NULL, 'PerGroomDay', 120, NULL),
-- Bảo hiểm
('Insurance', 'INS_TRANSIT', N'Bảo hiểm hành trình (% giá trị khai báo)', NULL, NULL, 'Percent', 1, NULL);
GO

-- Seed quy định giấy tờ theo quốc gia (ví dụ)
IF NOT EXISTS (SELECT 1 FROM clearance.CountryDocRequirements)
INSERT INTO clearance.CountryDocRequirements (CountryCode, Direction, DocTypeID, ValidityDays, IsMandatory, RegulationNote)
SELECT c.CountryCode, c.Direction, d.DocTypeID, c.ValidityDays, 1, c.Note
FROM (VALUES
    ('VN', 'Export', 'HORSE_PASSPORT', NULL, N'Hộ chiếu ngựa còn hiệu lực'),
    ('VN', 'Export', 'HEALTH_CERT',    10,   N'Cục Thú y cấp trong 10 ngày trước ngày đi'),
    ('CN', 'Import', 'COGGINS_EIA',    30,   N'Xét nghiệm EIA âm tính trong 30 ngày'),
    ('CN', 'Import', 'VACCINE',        180,  N'Tiêm phòng cúm ngựa trong 6 tháng'),
    ('FR', 'Import', 'HORSE_PASSPORT', NULL, N'EU Regulation 2020/692'),
    ('FR', 'Import', 'COGGINS_EIA',    30,   N'EU Regulation 2020/692'),
    ('FR', 'Import', 'HEALTH_CERT',    2,    N'Chứng nhận sức khỏe trong 48 giờ trước khi bay'),
    ('FR', 'Import', 'VACCINE',        180,  N'Equine Influenza')
) AS c(CountryCode, Direction, DocCode, ValidityDays, Note)
JOIN clearance.DocumentTypes d ON d.Code = c.DocCode;
GO

-- =====================================================================================
-- D.2  THỦ TỤC LẬP BÁO GIÁ
--   Mọi mức giá đọc từ pricing.PriceItems. Với mỗi khoản, lấy dòng khớp phương thức và
--   nước đến; dòng ghi rõ nước đến được ưu tiên hơn dòng dùng chung (NULL).
--   Kết quả: trả về từng dòng báo giá, ghi tổng vào EstimatedCost và lưu các dòng
--   dưới dạng JSON vào QuoteBreakdown của đơn.
--
--   Cước gốc      = Σ ngựa [ (Air: giá / ngựa | Ground: DistanceKm x giá / km) x Hệ số hạng chuồng ]
--   Cước sau CK   = Cước gốc x (1 - %Chiết khấu số lượng)
--   Phụ phí       = Cước sau CK x (%Nhiên liệu + %Điều hòa + %Gấp)
--   Phí thủ tục   = Số ngựa x (Hồ sơ + Thông quan + Kiểm dịch)
--   Phí áp tải    = CEILING(Số ngựa / 3) x đơn giá groom (Air: theo chuyến | Ground: theo ngày)
--   Bảo hiểm      = Giá trị khai báo x 1% (nếu khách chọn)
-- =====================================================================================
CREATE OR ALTER PROCEDURE pricing.usp_CalculateBookingQuote
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Mode VARCHAR(10), @Dest CHAR(2), @DistanceKm INT, @IsExpress BIT,
            @Climate BIT, @DeclaredValue DECIMAL(18,2), @Days INT;

    SELECT @Mode = TransportMode, @Dest = DropoffCountryCode,
           @DistanceKm = DistanceKm, @IsExpress = IsExpress, @Climate = RequiresClimateControl,
           @DeclaredValue = DeclaredValue,
           @Days = CEILING(DATEDIFF(HOUR, DepartureDate, DeliveryDate) / 24.0)
    FROM booking.BookingRequests WHERE BookingID = @BookingID;

    IF @Mode IS NULL
    BEGIN RAISERROR(N'Không tìm thấy đơn đặt chuyến.', 16, 1); RETURN; END

    -- Các khoản giá áp dụng cho đơn này: mỗi ItemCode lấy đúng 1 dòng, ưu tiên dòng cụ thể nhất
    DECLARE @P TABLE (ItemCode VARCHAR(30) PRIMARY KEY, ItemName NVARCHAR(100), Category VARCHAR(20),
                      CalcType VARCHAR(20), Value DECIMAL(18,4), MinHorses INT);
    INSERT INTO @P
    SELECT ItemCode, ItemName, Category, CalcType, Value, MinHorses
    FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY ItemCode
                     ORDER BY CASE WHEN DestCountryCode IS NULL THEN 1 ELSE 0 END,
                              CASE WHEN TransportMode IS NULL THEN 1 ELSE 0 END) AS rn
          FROM pricing.PriceItems
          WHERE IsActive = 1
            AND (TransportMode = @Mode OR TransportMode IS NULL)
            AND (DestCountryCode = @Dest OR DestCountryCode IS NULL)) x
    WHERE rn = 1;

    DECLARE @RouteRate DECIMAL(18,4) = (SELECT Value FROM @P WHERE ItemCode = 'FREIGHT');
    IF @RouteRate IS NULL
    BEGIN RAISERROR(N'Tuyến này chưa có trong bảng giá (pricing.PriceItems).', 16, 1); RETURN; END
    IF @Mode = 'Ground' AND @DistanceKm IS NULL
    BEGIN RAISERROR(N'Đơn đường bộ cần có DistanceKm để tính cước.', 16, 1); RETURN; END

    DECLARE @UnitFreight DECIMAL(18,2) = CASE WHEN @Mode = 'Air' THEN @RouteRate ELSE @DistanceKm * @RouteRate END;

    DECLARE @Lines TABLE (LineSeq INT IDENTITY(1,1), ChargeCode VARCHAR(30), Description NVARCHAR(200),
                          Quantity DECIMAL(10,2), UnitPrice DECIMAL(18,2), Amount DECIMAL(18,2));

    -- 1. Cước gốc theo từng hạng chuồng
    INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
    SELECT 'FREIGHT_' + UPPER(bh.StallClass), N'Cước vận chuyển - ' + p.ItemName, COUNT(*),
           @UnitFreight * p.Value, COUNT(*) * @UnitFreight * p.Value
    FROM booking.BookingHorses bh
    JOIN @P p ON p.ItemCode = 'STALL_' + UPPER(bh.StallClass)
    WHERE bh.BookingID = @BookingID AND bh.Status <> 'Cancelled'
    GROUP BY bh.StallClass, p.ItemName, p.Value;

    DECLARE @N INT = (SELECT COUNT(*) FROM booking.BookingHorses WHERE BookingID = @BookingID AND Status <> 'Cancelled');
    DECLARE @FreightBase DECIMAL(18,2) = ISNULL((SELECT SUM(Amount) FROM @Lines), 0);

    -- 2. Chiết khấu số lượng: lấy bậc cao nhất mà số ngựa đạt tới
    DECLARE @Discount DECIMAL(18,2) = 0;
    INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
    SELECT TOP 1 ItemCode, ItemName, 1, -ROUND(@FreightBase * Value / 100, 2), -ROUND(@FreightBase * Value / 100, 2)
    FROM @P WHERE Category = 'Discount' AND MinHorses <= @N
    ORDER BY MinHorses DESC;
    SELECT @Discount = -ISNULL(SUM(Amount), 0) FROM @Lines WHERE ChargeCode LIKE 'DISC[_]%';

    DECLARE @FreightNet DECIMAL(18,2) = @FreightBase - @Discount;

    -- 3. Phụ phí tính trên cước sau chiết khấu
    INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
    SELECT ItemCode, ItemName, 1, ROUND(@FreightNet * Value / 100, 2), ROUND(@FreightNet * Value / 100, 2)
    FROM @P
    WHERE Category = 'Surcharge'
      AND (ItemCode = 'SUR_FUEL'
           OR (ItemCode = 'SUR_CLIMATE' AND @Climate = 1)
           OR (ItemCode = 'SUR_EXPRESS' AND @IsExpress = 1))
    ORDER BY ItemCode DESC;

    -- 4. Phí thủ tục, thông quan, kiểm dịch
    INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
    SELECT ItemCode, ItemName,
           CASE WHEN CalcType = 'PerHorse' THEN @N ELSE 1 END, Value,
           CASE WHEN CalcType = 'PerHorse' THEN @N ELSE 1 END * Value
    FROM @P
    WHERE Category = 'Clearance' AND Value > 0
    ORDER BY CASE ItemCode WHEN 'FEE_DOCS' THEN 1 WHEN 'FEE_CLEARANCE' THEN 2 WHEN 'FEE_QUARANTINE' THEN 3 ELSE 4 END;

    -- 5. Phí áp tải: 1 groom cho mỗi 3 ngựa
    DECLARE @Grooms INT = CEILING(@N / 3.0);
    INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
    SELECT 'ESCORT', ItemName,
           @Grooms * CASE WHEN CalcType = 'PerGroomDay' THEN @Days ELSE 1 END, Value,
           @Grooms * CASE WHEN CalcType = 'PerGroomDay' THEN @Days ELSE 1 END * Value
    FROM @P WHERE ItemCode = 'ESCORT';

    -- 6. Bảo hiểm hành trình (tùy chọn)
    IF @DeclaredValue IS NOT NULL
        INSERT INTO @Lines (ChargeCode, Description, Quantity, UnitPrice, Amount)
        SELECT ItemCode, ItemName, 1, ROUND(@DeclaredValue * Value / 100, 2), ROUND(@DeclaredValue * Value / 100, 2)
        FROM @P WHERE ItemCode = 'INS_TRANSIT';

    -- Ghi tổng và chi tiết báo giá về đơn
    UPDATE booking.BookingRequests
    SET EstimatedCost = (SELECT SUM(Amount) FROM @Lines),
        QuoteBreakdown = (SELECT ChargeCode AS code, Description AS name, Quantity AS qty, UnitPrice AS unitPrice, Amount AS amount
                          FROM @Lines ORDER BY LineSeq FOR JSON PATH)
    WHERE BookingID = @BookingID;

    SELECT ChargeCode, Description, Quantity, UnitPrice, Amount FROM @Lines ORDER BY LineSeq;
END;
GO

-- =====================================================================================
-- E. SỬA THỦ TỤC CHỐT KPI
--   Lỗi cũ: chỉ xét sự cố Status = 'Approved'. Khi sự cố đã xử lý xong ('Resolved') thì
--   chuyến trễ do bất khả kháng lại bị tính là lỗi vận hành và bị trừ điểm KPI.
--   Bổ sung: chỉ đóng được chuyến đã có e-POD; đóng chuyến xong thì trả xe và hoàn tất các đơn
--   mà toàn bộ ngựa đã giao xong (một chuyến có thể chở ngựa của nhiều đơn).
-- =====================================================================================
CREATE OR ALTER PROCEDURE acceptance.usp_CloseAndSettleTrip
    @TripID INT,
    @ClosedByUserID INT,
    @ExecutiveRemarks NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM acceptance.HandoverAcceptances WHERE TripID = @TripID)
    BEGIN RAISERROR(N'Chưa có biên bản bàn giao e-POD, không thể đóng chuyến.', 16, 1); RETURN; END

    DECLARE @PlannedEnd DATETIMEOFFSET, @ActualEnd DATETIMEOFFSET, @VehicleID INT;
    SELECT @PlannedEnd = PlannedEndDate, @ActualEnd = ActualEndDate, @VehicleID = VehicleID
    FROM fleet.Trips WHERE TripID = @TripID;

    IF @ActualEnd IS NULL SET @ActualEnd = SYSUTCDATETIME();

    DECLARE @VarianceMinutes INT = DATEDIFF(MINUTE, @PlannedEnd, @ActualEnd);
    IF @VarianceMinutes < 0 SET @VarianceMinutes = 0;

    -- Sự cố đã được Manager duyệt phương án (kể cả đã xử lý xong) = bất khả kháng
    DECLARE @HasIncident BIT = 0;
    IF EXISTS (SELECT 1 FROM incident.TripIncidents WHERE TripID = @TripID AND Status IN ('Approved', 'Resolved'))
        SET @HasIncident = 1;

    DECLARE @OnTimeStatus VARCHAR(30) = 'OnTime';
    DECLARE @KPIScore DECIMAL(5,2) = 100.00;

    IF @VarianceMinutes > 30
    BEGIN
        IF @HasIncident = 1
            SET @OnTimeStatus = 'Delayed_AcceptableForceMajeure';
        ELSE
        BEGIN
            SET @OnTimeStatus = 'Delayed_OperationalFault';
            SET @KPIScore = 100.00 - (@VarianceMinutes / 30.0) * 5.0;
            IF @KPIScore < 50.00 SET @KPIScore = 50.00;
        END
    END

    UPDATE fleet.Trips
    SET ActualEndDate = @ActualEnd,
        DelayMinutes = @VarianceMinutes,
        OnTimeStatus = @OnTimeStatus,
        KPIScore = @KPIScore,
        ActualCost = PlannedCost + ISNULL((SELECT SUM(AdditionalCost) FROM incident.TripIncidents
                                           WHERE TripID = @TripID AND Status IN ('Approved', 'Resolved')), 0),
        ClosedByUserID = @ClosedByUserID,
        ClosedAt = SYSUTCDATETIME(),
        OverallStatus = 'Completed',
        ExecutiveRemarks = @ExecutiveRemarks
    WHERE TripID = @TripID;

    -- Trả xe về đội, chờ khử trùng
    UPDATE fleet.TransportAssets SET Status = 'Available' WHERE AssetID = @VehicleID;

    -- Hoàn tất các đơn có ngựa trên chuyến này, nếu MỌI con ngựa (chưa hủy) của đơn đã giao xong:
    -- con ngựa giao xong = có ít nhất một chuyến Completed và không còn chuyến nào dang dở.
    UPDATE b
    SET Status = 'Completed'
    FROM booking.BookingRequests b
    WHERE b.Status IN ('Approved', 'Assigned')
      AND EXISTS (SELECT 1 FROM fleet.vw_TripBookings tb WHERE tb.TripID = @TripID AND tb.BookingID = b.BookingID)
      AND NOT EXISTS (
            SELECT 1 FROM booking.BookingHorses bh
            WHERE bh.BookingID = b.BookingID AND bh.Status <> 'Cancelled'
              AND (NOT EXISTS (SELECT 1 FROM fleet.TripHorses th JOIN fleet.Trips t ON t.TripID = th.TripID
                               WHERE th.BookingHorseID = bh.BookingHorseID AND t.OverallStatus = 'Completed')
                   OR EXISTS (SELECT 1 FROM fleet.TripHorses th JOIN fleet.Trips t ON t.TripID = th.TripID
                              WHERE th.BookingHorseID = bh.BookingHorseID AND t.OverallStatus NOT IN ('Completed', 'Cancelled'))));

    PRINT N'>> Chuyến đi [' + CAST(@TripID AS VARCHAR(10)) + N'] đã đóng. ' + @OnTimeStatus + ' - KPI: ' + CAST(@KPIScore AS VARCHAR(10));
END;
GO

PRINT N'>> Script 04 thành công: 15 bảng cũ đã được bổ sung ràng buộc + 3 bảng mới (tổng 18 bảng).';
GO
