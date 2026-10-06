-- =====================================================================================
-- SCRIPT 02: LEAN DATABASE SCHEMA (14 CORE TABLES FOR SWP391)
-- System: Cross-Border Racehorse Transport System (Hệ thống vận chuyển ngựa đua xuyên quốc gia)
-- Target DBMS: Microsoft SQL Server 2019+ / Azure SQL Database
-- Description: Optimized for course project execution (SWP391): 14 essential tables,
--              unified Users table, TackGo-style customer flow, 0 redundant tables,
--              automated KPI settlement procedure, and Haversine distance UDF.
-- =====================================================================================

USE CrossBorderRacehorseTransportDB;
GO

-- Drop existing tables in reverse dependency order if re-running
IF OBJECT_ID('common.SystemNotifications', 'U') IS NOT NULL DROP TABLE common.SystemNotifications;
IF OBJECT_ID('acceptance.HandoverAcceptances', 'U') IS NOT NULL DROP TABLE acceptance.HandoverAcceptances;
IF OBJECT_ID('incident.TripIncidents', 'U') IS NOT NULL DROP TABLE incident.TripIncidents;
IF OBJECT_ID('tracking.HorseWelfareLogs', 'U') IS NOT NULL DROP TABLE tracking.HorseWelfareLogs;
IF OBJECT_ID('fleet.RouteCheckpoints', 'U') IS NOT NULL DROP TABLE fleet.RouteCheckpoints;
IF OBJECT_ID('fleet.TripHorses', 'U') IS NOT NULL DROP TABLE fleet.TripHorses;
IF OBJECT_ID('fleet.Trips', 'U') IS NOT NULL DROP TABLE fleet.Trips;
IF OBJECT_ID('fleet.TransportAssets', 'U') IS NOT NULL DROP TABLE fleet.TransportAssets;
IF OBJECT_ID('clearance.DossierDocuments', 'U') IS NOT NULL DROP TABLE clearance.DossierDocuments;
IF OBJECT_ID('clearance.DigitalDossiers', 'U') IS NOT NULL DROP TABLE clearance.DigitalDossiers;
IF OBJECT_ID('clearance.DocumentTypes', 'U') IS NOT NULL DROP TABLE clearance.DocumentTypes;
IF OBJECT_ID('booking.BookingHorses', 'U') IS NOT NULL DROP TABLE booking.BookingHorses;
IF OBJECT_ID('booking.BookingRequests', 'U') IS NOT NULL DROP TABLE booking.BookingRequests;
IF OBJECT_ID('racehorse.Horses', 'U') IS NOT NULL DROP TABLE racehorse.Horses;
IF OBJECT_ID('auth.Users', 'U') IS NOT NULL DROP TABLE auth.Users;
GO

-- =====================================================================================
-- 1. AUTH & USERS (1 BẢNG DUY NHẤT: KHÁCH HÀNG & NHÂN SỰ)
-- =====================================================================================

-- Bảng 1: auth.Users (Gộp cả khách hàng cá nhân TackGo-style và nhân viên điều hành)
CREATE TABLE auth.Users (
    UserID INT IDENTITY(1,1) CONSTRAINT PK_auth_Users PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL CONSTRAINT UQ_auth_Users_Email UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(30) NULL,
    Role VARCHAR(30) NOT NULL CONSTRAINT DF_auth_Users_Role DEFAULT 'Customer'
        CONSTRAINT CK_auth_Users_Role CHECK (Role IN ('Customer', 'LogisticsManager', 'TransportSpecialist', 'FleetCoordinator', 'DriverEscort', 'Admin')),
    IsActive BIT NOT NULL CONSTRAINT DF_auth_Users_IsActive DEFAULT 1,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_auth_Users_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

-- =====================================================================================
-- 2. RACEHORSE (HỒ SƠ CÁ THỂ NGỰA ĐUA)
-- =====================================================================================

-- Bảng 2: racehorse.Horses
CREATE TABLE racehorse.Horses (
    HorseID INT IDENTITY(1,1) CONSTRAINT PK_racehorse_Horses PRIMARY KEY,
    OwnerUserID INT NOT NULL, -- Khóa ngoại trỏ thẳng về Users (Chủ sở hữu)
    Name NVARCHAR(100) NOT NULL,
    MicrochipNumber VARCHAR(30) NOT NULL CONSTRAINT UQ_racehorse_Horses_Microchip UNIQUE, -- Mã RFID ISO
    PassportNumber VARCHAR(50) NOT NULL CONSTRAINT UQ_racehorse_Horses_Passport UNIQUE, -- Hộ chiếu FEI
    Breed NVARCHAR(50) NOT NULL CONSTRAINT DF_racehorse_Horses_Breed DEFAULT N'Thoroughbred',
    Gender VARCHAR(10) NOT NULL CONSTRAINT CK_racehorse_Horses_Gender CHECK (Gender IN ('Stallion', 'Mare', 'Gelding')),
    DateOfBirth DATE NOT NULL,
    Color NVARCHAR(30) NOT NULL,
    SpecialCareRequirements NVARCHAR(MAX) NULL, -- Chế độ dinh dưỡng, đệm chuồng, tiền sử say xe
    PhotoUrl NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_racehorse_Horses_IsActive DEFAULT 1,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_racehorse_Horses_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_racehorse_Horses_Owner FOREIGN KEY (OwnerUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- 3. BOOKING (YÊU CẦU ĐẶT CHUYẾN & GÁN TASK - FLOW 1)
-- =====================================================================================

-- Bảng 3: booking.BookingRequests (Gộp luôn 2 cột phân công Specialist & Coordinator)
CREATE TABLE booking.BookingRequests (
    BookingID INT IDENTITY(1,1) CONSTRAINT PK_booking_BookingRequests PRIMARY KEY,
    BookingCode VARCHAR(30) NOT NULL CONSTRAINT UQ_booking_BookingRequests_Code UNIQUE,
    CustomerUserID INT NOT NULL,
    PickupAddress NVARCHAR(255) NOT NULL,
    PickupCountryCode CHAR(2) NOT NULL,
    DropoffAddress NVARCHAR(255) NOT NULL,
    DropoffCountryCode CHAR(2) NOT NULL,
    DepartureDate DATETIMEOFFSET NOT NULL,
    DeliveryDate DATETIMEOFFSET NOT NULL,
    TotalHorses INT NOT NULL CONSTRAINT CK_booking_BookingRequests_Total CHECK (TotalHorses > 0),
    SpecialInstructions NVARCHAR(MAX) NULL,
    EstimatedCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_booking_BookingRequests_Cost DEFAULT 0.00,
    CurrencyCode CHAR(3) NOT NULL CONSTRAINT DF_booking_BookingRequests_Currency DEFAULT 'USD',
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_booking_BookingRequests_Status DEFAULT 'Submitted'
        CONSTRAINT CK_booking_BookingRequests_Status CHECK (Status IN ('Submitted', 'Approved', 'Rejected', 'Cancelled')),
    RejectionReason NVARCHAR(500) NULL,
    ReviewedByUserID INT NULL,
    ReviewedAt DATETIMEOFFSET NULL,
    -- Gộp phân công nhiệm vụ song song trực tiếp:
    AssignedSpecialistID INT NULL, -- Chuyên viên phụ trách hồ sơ kiểm dịch
    AssignedCoordinatorID INT NULL, -- Điều phối viên phụ trách lộ trình/xe
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_booking_BookingRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_booking_BookingRequests_Customer FOREIGN KEY (CustomerUserID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_booking_BookingRequests_Reviewer FOREIGN KEY (ReviewedByUserID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_booking_BookingRequests_Specialist FOREIGN KEY (AssignedSpecialistID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_booking_BookingRequests_Coordinator FOREIGN KEY (AssignedCoordinatorID) REFERENCES auth.Users(UserID)
);
GO

-- Bảng 4: booking.BookingHorses (Bảng liên kết Nhiều - Nhiều giữa Booking và Ngựa)
CREATE TABLE booking.BookingHorses (
    BookingHorseID INT IDENTITY(1,1) CONSTRAINT PK_booking_BookingHorses PRIMARY KEY,
    BookingID INT NOT NULL,
    HorseID INT NOT NULL,
    Notes NVARCHAR(300) NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_booking_BookingHorses_Status DEFAULT 'Pending'
        CONSTRAINT CK_booking_BookingHorses_Status CHECK (Status IN ('Pending', 'Approved', 'Cancelled')),
    CONSTRAINT UQ_booking_BookingHorses UNIQUE (BookingID, HorseID),
    CONSTRAINT FK_booking_BookingHorses_Booking FOREIGN KEY (BookingID) REFERENCES booking.BookingRequests(BookingID),
    CONSTRAINT FK_booking_BookingHorses_Horse FOREIGN KEY (HorseID) REFERENCES racehorse.Horses(HorseID)
);
GO

-- =====================================================================================
-- 4. CLEARANCE & DOSSIERS (HỒ SƠ KIỂM DỊCH & THÔNG QUAN - FLOW 2)
-- =====================================================================================

-- Bảng 5: clearance.DocumentTypes (Danh mục loại giấy tờ)
CREATE TABLE clearance.DocumentTypes (
    DocTypeID INT IDENTITY(1,1) CONSTRAINT PK_clearance_DocumentTypes PRIMARY KEY,
    Code VARCHAR(30) NOT NULL CONSTRAINT UQ_clearance_DocumentTypes_Code UNIQUE,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsMandatory BIT NOT NULL CONSTRAINT DF_clearance_DocumentTypes_Mandatory DEFAULT 1
);
GO

-- Bảng 6: clearance.DigitalDossiers (Bộ hồ sơ số hóa cho từng con ngựa trong đơn)
CREATE TABLE clearance.DigitalDossiers (
    DossierID INT IDENTITY(1,1) CONSTRAINT PK_clearance_DigitalDossiers PRIMARY KEY,
    DossierCode VARCHAR(30) NOT NULL CONSTRAINT UQ_clearance_DigitalDossiers_Code UNIQUE,
    BookingHorseID INT NOT NULL CONSTRAINT UQ_clearance_DigitalDossiers_BookingHorse UNIQUE,
    SpecialistUserID INT NOT NULL,
    Status VARCHAR(30) NOT NULL CONSTRAINT DF_clearance_DigitalDossiers_Status DEFAULT 'Draft'
        CONSTRAINT CK_clearance_DigitalDossiers_Status CHECK (Status IN ('Draft', 'AwaitingDocs', 'Reviewing', 'SubmittedToAuthorities', 'Cleared', 'Issue')),
    ClearanceNumber VARCHAR(50) NULL,
    IssueReason NVARCHAR(MAX) NULL,
    ClearedAt DATETIMEOFFSET NULL,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_clearance_DigitalDossiers_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_clearance_DigitalDossiers_BookingHorse FOREIGN KEY (BookingHorseID) REFERENCES booking.BookingHorses(BookingHorseID),
    CONSTRAINT FK_clearance_DigitalDossiers_Specialist FOREIGN KEY (SpecialistUserID) REFERENCES auth.Users(UserID)
);
GO

-- Bảng 7: clearance.DossierDocuments (Tài liệu đính kèm: Passport, xét nghiệm Coggins)
CREATE TABLE clearance.DossierDocuments (
    DocumentID INT IDENTITY(1,1) CONSTRAINT PK_clearance_DossierDocuments PRIMARY KEY,
    DossierID INT NOT NULL,
    DocTypeID INT NOT NULL,
    DocumentNumber VARCHAR(100) NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    UploadedByUserID INT NOT NULL,
    UploadedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_clearance_DossierDocuments_UploadedAt DEFAULT SYSUTCDATETIME(),
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_clearance_DossierDocuments_Status DEFAULT 'Pending'
        CONSTRAINT CK_clearance_DossierDocuments_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected')),
    CorrectionNote NVARCHAR(500) NULL,
    ReviewedByUserID INT NULL,
    ReviewedAt DATETIMEOFFSET NULL,
    CONSTRAINT FK_clearance_DossierDocuments_Dossier FOREIGN KEY (DossierID) REFERENCES clearance.DigitalDossiers(DossierID),
    CONSTRAINT FK_clearance_DossierDocuments_DocType FOREIGN KEY (DocTypeID) REFERENCES clearance.DocumentTypes(DocTypeID),
    CONSTRAINT FK_clearance_DossierDocuments_Uploader FOREIGN KEY (UploadedByUserID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_clearance_DossierDocuments_Reviewer FOREIGN KEY (ReviewedByUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- 5. FLEET, TRIPS & CHECKPOINTS (ĐỘI XE, LỘ TRÌNH & CHUYẾN ĐI - FLOW 3)
-- =====================================================================================

-- Bảng 8: fleet.TransportAssets (Xe thùng chuyên dụng)
CREATE TABLE fleet.TransportAssets (
    AssetID INT IDENTITY(1,1) CONSTRAINT PK_fleet_TransportAssets PRIMARY KEY,
    AssetCode VARCHAR(30) NOT NULL CONSTRAINT UQ_fleet_TransportAssets_Code UNIQUE, -- Biển số xe
    AssetType VARCHAR(30) NOT NULL CONSTRAINT DF_fleet_Assets_Type DEFAULT 'HorseTruck_AirSuspension',
    CapacityHorses INT NOT NULL CONSTRAINT CK_fleet_Assets_Capacity CHECK (CapacityHorses BETWEEN 1 AND 12),
    HasClimateControl BIT NOT NULL CONSTRAINT DF_fleet_Assets_Climate DEFAULT 1,
    HasGpsTracker BIT NOT NULL CONSTRAINT DF_fleet_Assets_GPS DEFAULT 1,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_fleet_Assets_Status DEFAULT 'Available'
        CONSTRAINT CK_fleet_Assets_Status CHECK (Status IN ('Available', 'InTransit', 'Maintenance')),
    LastSanitizationDate DATETIMEOFFSET NULL
);
GO

-- Bảng 9: fleet.Trips (Gộp Kế hoạch vận chuyển & Quyết toán KPI đóng chuyến vào 1 bảng)
CREATE TABLE fleet.Trips (
    TripID INT IDENTITY(1,1) CONSTRAINT PK_fleet_Trips PRIMARY KEY,
    TripCode VARCHAR(30) NOT NULL CONSTRAINT UQ_fleet_Trips_Code UNIQUE,
    BookingID INT NOT NULL,
    VehicleID INT NOT NULL,
    DriverID INT NOT NULL,
    EscortID INT NOT NULL,
    PlannedStartDate DATETIMEOFFSET NOT NULL,
    PlannedEndDate DATETIMEOFFSET NOT NULL,
    ActualStartDate DATETIMEOFFSET NULL,
    ActualEndDate DATETIMEOFFSET NULL,
    PlannedCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_fleet_Trips_PlannedCost DEFAULT 0.00,
    ActualCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_fleet_Trips_ActualCost DEFAULT 0.00,
    OverallStatus VARCHAR(25) NOT NULL CONSTRAINT DF_fleet_Trips_Status DEFAULT 'Scheduled'
        CONSTRAINT CK_fleet_Trips_Status CHECK (OverallStatus IN ('Scheduled', 'InTransit', 'EmergencyRerouting', 'ArrivedDestination', 'Completed', 'Cancelled')),
    -- Quyết toán KPI đóng chuyến (Flow 6):
    DelayMinutes INT NOT NULL CONSTRAINT DF_fleet_Trips_Delay DEFAULT 0,
    OnTimeStatus VARCHAR(30) NOT NULL CONSTRAINT DF_fleet_Trips_OnTime DEFAULT 'OnTime',
    KPIScore DECIMAL(5,2) NOT NULL CONSTRAINT DF_fleet_Trips_KPI DEFAULT 100.00,
    ClosedByUserID INT NULL,
    ClosedAt DATETIMEOFFSET NULL,
    ExecutiveRemarks NVARCHAR(MAX) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_fleet_Trips_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_fleet_Trips_Booking FOREIGN KEY (BookingID) REFERENCES booking.BookingRequests(BookingID),
    CONSTRAINT FK_fleet_Trips_Vehicle FOREIGN KEY (VehicleID) REFERENCES fleet.TransportAssets(AssetID),
    CONSTRAINT FK_fleet_Trips_Driver FOREIGN KEY (DriverID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_fleet_Trips_Escort FOREIGN KEY (EscortID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_fleet_Trips_Closer FOREIGN KEY (ClosedByUserID) REFERENCES auth.Users(UserID)
);
GO

-- Bảng 10: fleet.TripHorses (Gán ngựa vào vị trí chuồng trên xe)
CREATE TABLE fleet.TripHorses (
    TripHorseID INT IDENTITY(1,1) CONSTRAINT PK_fleet_TripHorses PRIMARY KEY,
    TripID INT NOT NULL,
    BookingHorseID INT NOT NULL,
    StallSlotNumber INT NOT NULL,
    Notes NVARCHAR(200) NULL,
    CONSTRAINT UQ_fleet_TripHorses UNIQUE (TripID, BookingHorseID),
    CONSTRAINT FK_fleet_TripHorses_Trip FOREIGN KEY (TripID) REFERENCES fleet.Trips(TripID),
    CONSTRAINT FK_fleet_TripHorses_BookingHorse FOREIGN KEY (BookingHorseID) REFERENCES booking.BookingHorses(BookingHorseID)
);
GO

-- Bảng 11: fleet.RouteCheckpoints (Mốc lộ trình trạm dừng & Lưu luôn giờ check-in thực tế)
CREATE TABLE fleet.RouteCheckpoints (
    CheckpointID INT IDENTITY(1,1) CONSTRAINT PK_fleet_RouteCheckpoints PRIMARY KEY,
    TripID INT NOT NULL,
    SequenceOrder INT NOT NULL,
    CheckpointName NVARCHAR(100) NOT NULL,
    CheckpointType VARCHAR(30) NOT NULL CONSTRAINT CK_fleet_RouteCheckpoints_Type CHECK (CheckpointType IN ('Origin', 'RestStop', 'BorderGate', 'Destination')),
    Address NVARCHAR(255) NOT NULL,
    PlannedTime DATETIMEOFFSET NOT NULL,
    MandatoryRestMinutes INT NOT NULL CONSTRAINT DF_fleet_Checkpoints_Rest DEFAULT 0,
    -- Cột lưu giờ check-in thực tế của tài xế (thay thế bảng CheckpointCheckins riêng):
    ActualArrivalTime DATETIMEOFFSET NULL,
    ActualDepartureTime DATETIMEOFFSET NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_fleet_Checkpoints_Status DEFAULT 'Pending'
        CONSTRAINT CK_fleet_Checkpoints_Status CHECK (Status IN ('Pending', 'Arrived', 'Cleared', 'Departed', 'Cancelled')),
    IsActive BIT NOT NULL CONSTRAINT DF_fleet_Checkpoints_IsActive DEFAULT 1,
    CONSTRAINT FK_fleet_RouteCheckpoints_Trip FOREIGN KEY (TripID) REFERENCES fleet.Trips(TripID)
);
GO

-- =====================================================================================
-- 6. TRACKING (NHẬT KÝ PHÚC LỢI THỂ TRẠNG NGỰA - FLOW 4)
-- =====================================================================================

-- Bảng 12: tracking.HorseWelfareLogs (Lưu nhiệt độ cabin, ăn uống, stress kèm ảnh)
CREATE TABLE tracking.HorseWelfareLogs (
    LogID INT IDENTITY(1,1) CONSTRAINT PK_tracking_HorseWelfareLogs PRIMARY KEY,
    TripHorseID INT NOT NULL,
    CheckpointID INT NULL,
    RecordedByUserID INT NOT NULL,
    CabinTemp DECIMAL(4,1) NOT NULL,
    WaterIntakeLiters DECIMAL(4,1) NOT NULL,
    FeedStatus VARCHAR(20) NOT NULL CONSTRAINT CK_tracking_Welfare_Feed CHECK (FeedStatus IN ('Normal', 'Reduced', 'Refused')),
    StressLevel VARCHAR(20) NOT NULL CONSTRAINT CK_tracking_Welfare_Stress CHECK (StressLevel IN ('Calm', 'MildStress', 'Agitated')),
    Notes NVARCHAR(MAX) NULL,
    PhotoUrl NVARCHAR(500) NULL, -- Ảnh chụp ngựa thực tế gộp thẳng vào đây
    LoggedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_tracking_Welfare_LoggedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_tracking_Welfare_TripHorse FOREIGN KEY (TripHorseID) REFERENCES fleet.TripHorses(TripHorseID),
    CONSTRAINT FK_tracking_Welfare_Checkpoint FOREIGN KEY (CheckpointID) REFERENCES fleet.RouteCheckpoints(CheckpointID),
    CONSTRAINT FK_tracking_Welfare_Recorder FOREIGN KEY (RecordedByUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- 7. INCIDENT (SỰ CỐ, NẮN TUYẾN & NGÂN SÁCH GỘP - FLOW 5)
-- =====================================================================================

-- Bảng 13: incident.TripIncidents (Gộp cả thông tin sự cố, phương án xử lý và chi phí phát sinh)
CREATE TABLE incident.TripIncidents (
    IncidentID INT IDENTITY(1,1) CONSTRAINT PK_incident_TripIncidents PRIMARY KEY,
    IncidentCode VARCHAR(30) NOT NULL CONSTRAINT UQ_incident_Incidents_Code UNIQUE,
    TripID INT NOT NULL,
    ReportedByUserID INT NOT NULL,
    IncidentType VARCHAR(30) NOT NULL CONSTRAINT CK_incident_Incidents_Type CHECK (IncidentType IN ('MechanicalBreakdown', 'BorderCongestion', 'EquineHealthIssue', 'Weather')),
    Description NVARCHAR(MAX) NOT NULL,
    Location NVARCHAR(255) NOT NULL,
    -- Phương án xử lý & Chi phí gộp chung:
    ProposedAction NVARCHAR(255) NULL,
    RevisedRouteNotes NVARCHAR(MAX) NULL,
    AdditionalCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_incident_Incidents_Cost DEFAULT 0.00,
    Status VARCHAR(30) NOT NULL CONSTRAINT DF_incident_Incidents_Status DEFAULT 'Reported'
        CONSTRAINT CK_incident_Incidents_Status CHECK (Status IN ('Reported', 'PlanProposed', 'Approved', 'Resolved')),
    ApprovedByUserID INT NULL,
    ApprovedAt DATETIMEOFFSET NULL,
    ReportedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_incident_Incidents_ReportedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_incident_Incidents_Trip FOREIGN KEY (TripID) REFERENCES fleet.Trips(TripID),
    CONSTRAINT FK_incident_Incidents_Reporter FOREIGN KEY (ReportedByUserID) REFERENCES auth.Users(UserID),
    CONSTRAINT FK_incident_Incidents_Approver FOREIGN KEY (ApprovedByUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- 8. ACCEPTANCE & e-POD (BÀN GIAO & KÝ ĐIỆN TỬ - FLOW 6)
-- =====================================================================================

-- Bảng 14: acceptance.HandoverAcceptances (Biên bản bàn giao chữ ký điện tử e-POD)
CREATE TABLE acceptance.HandoverAcceptances (
    HandoverID INT IDENTITY(1,1) CONSTRAINT PK_acceptance_HandoverAcceptances PRIMARY KEY,
    TripID INT NOT NULL,
    HandoverDateTime DATETIMEOFFSET NOT NULL CONSTRAINT DF_acceptance_Handover_Time DEFAULT SYSUTCDATETIME(),
    RecipientName NVARCHAR(100) NOT NULL,
    RecipientPhone VARCHAR(30) NOT NULL,
    RecipientIdCard VARCHAR(50) NOT NULL,
    DigitalSignatureUrl NVARCHAR(500) NOT NULL, -- Chữ ký e-POD của khách
    OverallCondition VARCHAR(30) NOT NULL CONSTRAINT CK_acceptance_Condition CHECK (OverallCondition IN ('Excellent', 'NormalFatigue', 'Injured')),
    Remarks NVARCHAR(MAX) NULL,
    DriverUserID INT NOT NULL,
    CONSTRAINT FK_acceptance_Handover_Trip FOREIGN KEY (TripID) REFERENCES fleet.Trips(TripID),
    CONSTRAINT FK_acceptance_Handover_Driver FOREIGN KEY (DriverUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- 9. COMMON (DỊCH VỤ DÙNG CHUNG)
-- =====================================================================================

-- Bảng 15: common.SystemNotifications (Chuông thông báo demo đồ án)
CREATE TABLE common.SystemNotifications (
    NotificationID BIGINT IDENTITY(1,1) CONSTRAINT PK_common_Notifications PRIMARY KEY,
    RecipientUserID INT NOT NULL,
    Title NVARCHAR(150) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    ReferenceType VARCHAR(50) NULL,
    ReferenceID INT NULL,
    IsRead BIT NOT NULL CONSTRAINT DF_common_Notifications_IsRead DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_common_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_common_Notifications_Recipient FOREIGN KEY (RecipientUserID) REFERENCES auth.Users(UserID)
);
GO

-- =====================================================================================
-- STORED PROCEDURE TỰ ĐỘNG CHỐT KPI KHI ĐÓNG CHUYẾN (FLOW 6)
-- =====================================================================================

CREATE OR ALTER PROCEDURE acceptance.usp_CloseAndSettleTrip
    @TripID INT,
    @ClosedByUserID INT,
    @ExecutiveRemarks NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PlannedEnd DATETIMEOFFSET, @ActualEnd DATETIMEOFFSET;
    SELECT @PlannedEnd = PlannedEndDate, @ActualEnd = ActualEndDate
    FROM fleet.Trips WHERE TripID = @TripID;

    IF @ActualEnd IS NULL
    BEGIN
        SET @ActualEnd = SYSUTCDATETIME();
        UPDATE fleet.Trips SET ActualEndDate = @ActualEnd WHERE TripID = @TripID;
    END

    -- Tính số phút chênh lệch
    DECLARE @VarianceMinutes INT = DATEDIFF(MINUTE, @PlannedEnd, @ActualEnd);
    IF @VarianceMinutes < 0 SET @VarianceMinutes = 0;

    -- Kiểm tra có sự cố được duyệt không (Force Majeure)
    DECLARE @HasIncident BIT = 0;
    IF EXISTS (SELECT 1 FROM incident.TripIncidents WHERE TripID = @TripID AND Status = 'Approved')
        SET @HasIncident = 1;

    -- Phân loại OnTimeStatus & Điểm KPI
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

    -- Cập nhật trực tiếp vào bảng Trips
    UPDATE fleet.Trips
    SET DelayMinutes = @VarianceMinutes,
        OnTimeStatus = @OnTimeStatus,
        KPIScore = @KPIScore,
        ClosedByUserID = @ClosedByUserID,
        ClosedAt = SYSUTCDATETIME(),
        OverallStatus = 'Completed',
        ExecutiveRemarks = @ExecutiveRemarks
    WHERE TripID = @TripID;

    PRINT '>> Chuyến đi [' + CAST(@TripID AS VARCHAR(10)) + '] đã được đóng thành công. KPI On-time: ' + CAST(@KPIScore AS VARCHAR(10));
END;
GO

PRINT '>> Script 02 thành công: Đã khởi tạo đúng 14 Bảng dữ liệu cốt lõi + 1 Bảng thông báo trong [CrossBorderRacehorseTransportDB].';
GO
