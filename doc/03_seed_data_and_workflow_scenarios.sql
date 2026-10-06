-- =====================================================================================
-- SCRIPT 03: SEED DATA & COMPLETE WORKFLOW SIMULATION (14-TABLE LEAN SCHEMA)
-- System: Cross-Border Racehorse Transport System (Hệ thống vận chuyển ngựa đua xuyên quốc gia)
-- Target DBMS: Microsoft SQL Server 2019+ / Azure SQL Database
-- Description: Runs all 6 Flows end-to-end on the streamlined 14-table database schema.
-- =====================================================================================

USE CrossBorderRacehorseTransportDB;
GO

PRINT '>> [STEP 1] Seeding Master Lookup & Users Data...';

-- 1. Document Types
SET IDENTITY_INSERT clearance.DocumentTypes ON;
INSERT INTO clearance.DocumentTypes (DocTypeID, Code, Name, Description, IsMandatory) VALUES
(1, 'HORSE_PASSPORT', N'Hộ chiếu ngựa quốc tế (FEI Passport)', N'Hộ chiếu định danh cá thể do FEI cấp', 1),
(2, 'COGGINS_EIA', N'Chứng nhận xét nghiệm Coggins âm tính', N'Xét nghiệm thiếu máu truyền nhiễm ngựa trong 30 ngày', 1),
(3, 'HEALTH_CERT', N'Giấy chứng nhận kiểm dịch xuất nhập khẩu', N'Cục Thú Y cấp trước ngày đi', 1),
(4, 'VACCINE', N'Chứng nhận tiêm phòng cúm ngựa', N'Lịch tiêm phòng đầy đủ trong 6 tháng', 1);
SET IDENTITY_INSERT clearance.DocumentTypes OFF;
GO

-- 2. Transport Assets (Xe thùng chuyên dụng)
SET IDENTITY_INSERT fleet.TransportAssets ON;
INSERT INTO fleet.TransportAssets (AssetID, AssetCode, AssetType, CapacityHorses, HasClimateControl, HasGpsTracker, Status, LastSanitizationDate) VALUES
(1, '29B-888.99', 'HorseTruck_AirSuspension', 6, 1, 1, 'Available', SYSUTCDATETIME());
SET IDENTITY_INSERT fleet.TransportAssets OFF;
GO

-- 3. Users (Gồm cả Customer cá nhân TackGo-style và Nhân sự điều hành)
SET IDENTITY_INSERT auth.Users ON;
INSERT INTO auth.Users (UserID, FullName, Email, PasswordHash, PhoneNumber, Role) VALUES
(1, N'Trần Quốc Bảo', 'bao.tran@logistics.com', 'HASH_PASS_123', '+84912000001', 'LogisticsManager'),
(2, N'Nguyễn Thị Mai', 'mai.nguyen@clearance.com', 'HASH_PASS_123', '+84912000002', 'TransportSpecialist'),
(3, N'Lê Hoàng Nam', 'nam.le@fleet.com', 'HASH_PASS_123', '+84912000003', 'FleetCoordinator'),
(4, N'Phạm Văn Đức', 'duc.pham@transport.com', 'HASH_PASS_123', '+84912000004', 'DriverEscort'),
(5, N'Jane Smith', 'jane.smith@racehorseowner.com', 'HASH_PASS_123', '+84988111222', 'Customer'); -- Customer (Horse Owner)
SET IDENTITY_INSERT auth.Users OFF;
GO

-- 4. Horses (Thuộc sở hữu của Jane Smith - UserID 5)
SET IDENTITY_INSERT racehorse.Horses ON;
INSERT INTO racehorse.Horses (HorseID, OwnerUserID, Name, Breed, Gender, DateOfBirth, Color, MicrochipNumber, PassportNumber, SpecialCareRequirements) VALUES
(1, 5, N'Red Flash (Tia Chớp Đỏ)', 'Thoroughbred', 'Stallion', '2020-04-15', N'Hồng sắc', '982000412345671', 'FEI-VN-2023-01', N'Cần lót đệm rơm dày, nhiệt độ cabin 16-19°C'),
(2, 5, N'Golden Pegasus (Kim Mã)', 'Thoroughbred', 'Mare', '2021-03-10', N'Bạch sắc', '982000412345672', 'FEI-VN-2023-02', N'Dễ say xe nhẹ, cần treo bao cỏ tươi');
SET IDENTITY_INSERT racehorse.Horses OFF;
GO

PRINT '>> [STEP 2] SIMULATING FLOW 1: Booking Creation, Approval & Direct Assignment';

-- Customer Jane Smith tạo đơn hàng BKG-2026-0001 vận chuyển 2 ngựa sang Quảng Châu
SET IDENTITY_INSERT booking.BookingRequests ON;
INSERT INTO booking.BookingRequests (BookingID, BookingCode, CustomerUserID, PickupAddress, PickupCountryCode, DropoffAddress, DropoffCountryCode, DepartureDate, DeliveryDate, TotalHorses, EstimatedCost, Status) VALUES
(1, 'BKG-2026-0001', 5, N'Trang trại Yên Bài, Ba Vì, Hà Nội', 'VN', N'Trường đua Tùng Hóa, TP. Quảng Châu', 'CN', '2026-10-01 06:00:00 +07:00', '2026-10-02 18:00:00 +08:00', 2, 7500.00, 'Submitted');
SET IDENTITY_INSERT booking.BookingRequests OFF;
GO

-- Gán 2 con ngựa vào đơn
SET IDENTITY_INSERT booking.BookingHorses ON;
INSERT INTO booking.BookingHorses (BookingHorseID, BookingID, HorseID, Notes, Status) VALUES
(1, 1, 1, N'Chuồng 1 bên trái', 'Pending'),
(2, 1, 2, N'Chuồng 2 ở giữa', 'Pending');
SET IDENTITY_INSERT booking.BookingHorses OFF;
GO

-- Logistics Manager (Bảo - User 1) duyệt đơn và phân công trực tiếp 2 chuyên viên:
UPDATE booking.BookingRequests
SET Status = 'Approved',
    ReviewedByUserID = 1,
    ReviewedAt = SYSUTCDATETIME(),
    AssignedSpecialistID = 2,  -- Giao Mai làm thủ tục kiểm dịch
    AssignedCoordinatorID = 3  -- Giao Nam khảo sát tuyến/xe
WHERE BookingID = 1;

UPDATE booking.BookingHorses SET Status = 'Approved' WHERE BookingID = 1;
GO

PRINT '>> [STEP 3] SIMULATING FLOW 2: Digital Dossier, Documents & Clearance';

-- Specialist (Mai) khởi tạo Digital Dossier cho từng con ngựa
SET IDENTITY_INSERT clearance.DigitalDossiers ON;
INSERT INTO clearance.DigitalDossiers (DossierID, DossierCode, BookingHorseID, SpecialistUserID, Status) VALUES
(1, 'DOS-2026-0001', 1, 2, 'AwaitingDocs'),
(2, 'DOS-2026-0002', 2, 2, 'AwaitingDocs');
SET IDENTITY_INSERT clearance.DigitalDossiers OFF;
GO

-- Customer (Jane Smith) tải lên Hộ chiếu FEI & Phiếu xét nghiệm Coggins
SET IDENTITY_INSERT clearance.DossierDocuments ON;
INSERT INTO clearance.DossierDocuments (DocumentID, DossierID, DocTypeID, DocumentNumber, FileUrl, UploadedByUserID, Status) VALUES
(1, 1, 1, 'FEI-PASSPORT-982000412345671', 'https://storage.racehorse.vn/docs/rf_passport.pdf', 5, 'Pending'),
(2, 1, 2, 'COGGINS-LAB-2026-888', 'https://storage.racehorse.vn/docs/rf_coggins.pdf', 5, 'Pending'),
(3, 2, 1, 'FEI-PASSPORT-982000412345672', 'https://storage.racehorse.vn/docs/gp_passport.pdf', 5, 'Pending');
SET IDENTITY_INSERT clearance.DossierDocuments OFF;
GO

-- Specialist (Mai) thẩm định và phê duyệt hồ sơ hợp lệ
UPDATE clearance.DossierDocuments
SET Status = 'Approved', ReviewedByUserID = 2, ReviewedAt = SYSUTCDATETIME()
WHERE DocumentID IN (1, 2, 3);

-- Cập nhật thông quan: Đủ điều kiện xuất nhập cảnh
UPDATE clearance.DigitalDossiers
SET Status = 'Cleared',
    ClearanceNumber = 'VET-CERT-VN-CN-2026-001',
    ClearedAt = SYSUTCDATETIME()
WHERE DossierID IN (1, 2);
GO

PRINT '>> [STEP 4] SIMULATING FLOW 3: Trip Dispatching & Checkpoints Setup';

-- Fleet Coordinator (Nam) thiết lập chuyến đi và được LM duyệt
SET IDENTITY_INSERT fleet.Trips ON;
INSERT INTO fleet.Trips (TripID, TripCode, BookingID, VehicleID, DriverID, EscortID, PlannedStartDate, PlannedEndDate, PlannedCost, OverallStatus) VALUES
(1, 'TRP-2026-0001', 1, 1, 4, 4, '2026-10-01 06:00:00 +07:00', '2026-10-02 18:00:00 +08:00', 4200.00, 'Scheduled');
SET IDENTITY_INSERT fleet.Trips OFF;
GO

-- Xếp 2 con ngựa vào chuồng trên xe
SET IDENTITY_INSERT fleet.TripHorses ON;
INSERT INTO fleet.TripHorses (TripHorseID, TripID, BookingHorseID, StallSlotNumber, Notes) VALUES
(1, 1, 1, 1, N'Red Flash - Chuồng số 1'),
(2, 1, 2, 2, N'Golden Pegasus - Chuồng số 2');
SET IDENTITY_INSERT fleet.TripHorses OFF;
GO

-- Thiết lập các mốc trạm dừng
SET IDENTITY_INSERT fleet.RouteCheckpoints ON;
INSERT INTO fleet.RouteCheckpoints (CheckpointID, TripID, SequenceOrder, CheckpointName, CheckpointType, Address, PlannedTime, MandatoryRestMinutes, Status, IsActive) VALUES
(1, 1, 1, N'Điểm xuất phát Hà Nội', 'Origin', N'Trại Ba Vì, Hà Nội', '2026-10-01 06:00:00 +07:00', 0, 'Pending', 1),
(2, 1, 2, N'Cửa khẩu Quốc tế Hữu Nghị', 'BorderGate', N'Đồng Đăng, Lạng Sơn', '2026-10-01 11:30:00 +07:00', 120, 'Pending', 1),
(3, 1, 3, N'Trạm nghỉ cao tốc Nam Ninh', 'RestStop', N'Dịch vụ Nam Ninh, Quảng Tây', '2026-10-01 20:00:00 +08:00', 360, 'Pending', 1),
(4, 1, 4, N'Trường đua Tùng Hóa (Đích)', 'Destination', N'Tùng Hóa, TP. Quảng Châu', '2026-10-02 18:00:00 +08:00', 0, 'Pending', 1);
SET IDENTITY_INSERT fleet.RouteCheckpoints OFF;
GO

PRINT '>> [STEP 5] SIMULATING FLOW 4: Transit, Check-in & Welfare Monitoring Logs';

-- Tài xế Đức bắt đầu chuyến đi
UPDATE fleet.Trips
SET OverallStatus = 'InTransit', ActualStartDate = '2026-10-01 06:30:00 +07:00'
WHERE TripID = 1;

-- Check-in mốc 1 (Xuất phát) cập nhật trực tiếp vào bảng RouteCheckpoints:
UPDATE fleet.RouteCheckpoints
SET Status = 'Departed', ActualArrivalTime = '2026-10-01 06:00:00 +07:00', ActualDepartureTime = '2026-10-01 06:30:00 +07:00'
WHERE CheckpointID = 1;

-- Escort ghi nhật ký phúc lợi ngựa tại mốc 1
SET IDENTITY_INSERT tracking.HorseWelfareLogs ON;
INSERT INTO tracking.HorseWelfareLogs (LogID, TripHorseID, CheckpointID, RecordedByUserID, CabinTemp, WaterIntakeLiters, FeedStatus, StressLevel, Notes, PhotoUrl) VALUES
(1, 1, 1, 4, 17.5, 10.0, 'Normal', 'Calm', N'Red Flash thể trạng tốt, ăn uống bình thường', 'https://storage.racehorse.vn/logs/rf_01.jpg'),
(2, 2, 1, 4, 17.5, 8.0, 'Normal', 'Calm', N'Golden Pegasus ổn định, không say xe', 'https://storage.racehorse.vn/logs/gp_01.jpg');
SET IDENTITY_INSERT tracking.HorseWelfareLogs OFF;
GO

PRINT '>> [STEP 6] SIMULATING FLOW 5: Border Congestion Incident & Dynamic Rerouting';

-- Tài xế đến Hữu Nghị gặp sự cố kẹt xe kéo dài > 8 tiếng, báo động SOS
SET IDENTITY_INSERT incident.TripIncidents ON;
INSERT INTO incident.TripIncidents (IncidentID, IncidentCode, TripID, ReportedByUserID, IncidentType, Description, Location, ProposedAction, RevisedRouteNotes, AdditionalCost, Status, ApprovedByUserID, ApprovedAt) VALUES
(1, 'INC-2026-0001', 1, 4, 'BorderCongestion', N'Tắc biên Hữu Nghị kéo dài hơn 8 tiếng do hỏng máy soi hải quan', N'Cửa khẩu Hữu Nghị', N'Nắn tuyến sang Cửa khẩu Tân Thanh cách 18km', N'Đã liên hệ trạm thú y Tân Thanh hỗ trợ làn xanh ưu tiên', 400.00, 'Approved', 1, SYSUTCDATETIME());
SET IDENTITY_INSERT incident.TripIncidents OFF;
GO

-- Cập nhật chuyến xe sang trạng thái nắn tuyến
UPDATE fleet.Trips SET OverallStatus = 'EmergencyRerouting' WHERE TripID = 1;

-- Hủy mốc Hữu Nghị (IsActive = 0) và thêm mốc mới Tân Thanh:
UPDATE fleet.RouteCheckpoints SET Status = 'Cancelled', IsActive = 0 WHERE CheckpointID = 2;

SET IDENTITY_INSERT fleet.RouteCheckpoints ON;
INSERT INTO fleet.RouteCheckpoints (CheckpointID, TripID, SequenceOrder, CheckpointName, CheckpointType, Address, PlannedTime, MandatoryRestMinutes, Status, ActualArrivalTime, ActualDepartureTime, IsActive) VALUES
(5, 1, 2, N'Cửa khẩu Tân Thanh (Đã nắn tuyến)', 'BorderGate', N'Tân Thanh, Lạng Sơn', '2026-10-01 12:00:00 +07:00', 90, 'Cleared', '2026-10-01 12:15:00 +07:00', '2026-10-01 13:45:00 +07:00', 1);
SET IDENTITY_INSERT fleet.RouteCheckpoints OFF;
GO

UPDATE incident.TripIncidents SET Status = 'Resolved' WHERE IncidentID = 1;
UPDATE fleet.Trips SET OverallStatus = 'InTransit' WHERE TripID = 1;
GO

PRINT '>> [STEP 7] SIMULATING FLOW 6: Arrival, e-POD & Automated KPI Settle';

-- Đến đích an toàn tại Tùng Hóa
UPDATE fleet.RouteCheckpoints
SET Status = 'Arrived', ActualArrivalTime = '2026-10-02 18:30:00 +08:00'
WHERE CheckpointID = 4;

UPDATE fleet.Trips
SET OverallStatus = 'ArrivedDestination', ActualEndDate = '2026-10-02 18:30:00 +08:00'
WHERE TripID = 1;

-- Khách hàng Jane Smith kiểm tra đối chiếu mã chip và ký biên bản e-POD
SET IDENTITY_INSERT acceptance.HandoverAcceptances ON;
INSERT INTO acceptance.HandoverAcceptances (HandoverID, TripID, RecipientName, RecipientPhone, RecipientIdCard, DigitalSignatureUrl, OverallCondition, Remarks, DriverUserID) VALUES
(1, 1, N'Jane Smith', '+84988111222', 'PASSPORT-US-991283', 'https://storage.racehorse.vn/signatures/epod_trip1.png', 'Excellent', N'2 cá thể ngựa đến nơi an toàn tuyệt đối, không trầy xước.', 4);
SET IDENTITY_INSERT acceptance.HandoverAcceptances OFF;
GO

-- Logistics Manager chạy Stored Procedure tự động chốt chuyến và tính KPI On-Time Delivery
EXEC acceptance.usp_CloseAndSettleTrip 
    @TripID = 1,
    @ClosedByUserID = 1,
    @ExecutiveRemarks = N'Chuyến đi vận chuyển an toàn thành công. Sự cố tắc biên được nắn tuyến kịp thời, tính lý do bất khả kháng Force Majeure.';
GO

PRINT '>> [STEP 8] VERIFICATION RESULTS (14-TABLE LEAN SCHEMA):';
GO

-- 1. Xem kết quả chốt chuyến và KPI nằm trực tiếp trong bảng Trips
SELECT 
    t.TripCode,
    b.BookingCode,
    u.FullName AS DriverName,
    t.PlannedCost,
    t.DelayMinutes,
    t.OnTimeStatus,
    t.KPIScore,
    t.OverallStatus,
    t.ExecutiveRemarks
FROM fleet.Trips t
JOIN booking.BookingRequests b ON t.BookingID = b.BookingID
JOIN auth.Users u ON t.DriverID = u.UserID;

-- 2. Xem các mốc lộ trình (đã nắn tuyến từ Hữu Nghị sang Tân Thanh)
SELECT 
    rc.SequenceOrder,
    rc.CheckpointName,
    rc.CheckpointType,
    rc.Status,
    rc.IsActive,
    rc.ActualArrivalTime
FROM fleet.RouteCheckpoints rc
WHERE rc.TripID = 1
ORDER BY rc.SequenceOrder, rc.CheckpointID;

PRINT '>> Script 03 thành công: 6 Flows nghiệp vụ đã chạy mượt mà trên CSDL [CrossBorderRacehorseTransportDB]!';
GO
