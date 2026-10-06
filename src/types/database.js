/**
 * @file database.js
 * @description Data contracts and JSDoc typedefs for CrossBorderRacehorseTransportDB (18 tables after review fixes v3).
 * Synchronized 100% with DB Schema (T-SQL Scripts 01, 02, 03, 04 and 8 State Diagrams).
 */

/**
 * @typedef {'Customer' | 'LogisticsManager' | 'TransportSpecialist' | 'FleetCoordinator' | 'DriverEscort' | 'Admin'} UserRole
 */

/**
 * @typedef {'Stallion' | 'Mare' | 'Gelding'} HorseGender
 */

/**
 * Vòng đời đơn đặt chuyến (st1_booking.png & Script 04)
 * @typedef {'Submitted' | 'Approved' | 'Assigned' | 'Completed' | 'Rejected' | 'Expired' | 'Cancelled'} BookingStatus
 */

/**
 * Trạng thái ngựa trong đơn (st2_bookinghorse.png)
 * @typedef {'Pending' | 'Approved' | 'Cancelled'} BookingHorseStatus
 */

/**
 * Vòng đời bộ hồ sơ kiểm dịch (st3_dossier.png)
 * @typedef {'Draft' | 'AwaitingDocs' | 'Reviewing' | 'SubmittedToAuthorities' | 'Cleared' | 'Issue'} DossierStatus
 */

/**
 * Trạng thái từng tài liệu trong bộ hồ sơ (st4_document.png)
 * @typedef {'Pending' | 'Approved' | 'Rejected'} DocumentStatus
 */

/**
 * Trạng thái phương tiện vận tải (st8_asset.png)
 * @typedef {'Available' | 'InTransit' | 'Maintenance'} AssetStatus
 */

/**
 * Loại phương tiện vận tải chuyên dụng (Script 04)
 * @typedef {'HorseTruck_AirSuspension' | 'HorseVan' | 'AirStall'} AssetType
 */

/**
 * Vòng đời chuyến đi (st5_trip.png & Script 04)
 * @typedef {'Draft' | 'PendingApproval' | 'Scheduled' | 'InTransit' | 'EmergencyRerouting' | 'ArrivedDestination' | 'Completed' | 'Cancelled'} TripStatus
 */

/**
 * @typedef {'Origin' | 'RestStop' | 'BorderGate' | 'Destination'} CheckpointType
 */

/**
 * Trạng thái trạm kiểm soát mốc lộ trình (st6_checkpoint.png)
 * @typedef {'Pending' | 'Arrived' | 'Cleared' | 'Departed' | 'Cancelled'} CheckpointStatus
 */

/**
 * @typedef {'Normal' | 'Reduced' | 'Refused'} FeedStatus
 */

/**
 * @typedef {'Calm' | 'MildStress' | 'Agitated'} StressLevel
 */

/**
 * Loại sự cố (Script 04)
 * @typedef {'MechanicalBreakdown' | 'BorderCongestion' | 'EquineHealthIssue' | 'Weather' | 'ClimateControlFailure' | 'CustomsHold' | 'Other'} IncidentType
 */

/**
 * Trạng thái sự cố (st7_incident.png & Script 04)
 * @typedef {'Reported' | 'PlanProposed' | 'Approved' | 'Rejected' | 'Resolved'} IncidentStatus
 */

/**
 * Mức độ nghiêm trọng của sự cố (Script 04)
 * @typedef {'Minor' | 'Moderate' | 'Major' | 'Critical'} IncidentSeverity
 */

/**
 * Phương thức vận chuyển (Script 04)
 * @typedef {'Ground' | 'Air'} TransportMode
 */

/**
 * Hạng chuồng của ngựa trong đơn (Script 04)
 * @typedef {'Shared' | 'Comfort' | 'Private'} StallClass
 */

/**
 * Vai trò nhân sự trong tổ đội chuyến đi (Script 04)
 * @typedef {'Driver' | 'Escort'} CrewRole
 */

/**
 * Tình trạng ngựa khi nghiệm thu bàn giao e-POD (Script 02 & 04)
 * @typedef {'Excellent' | 'NormalFatigue' | 'Injured'} HandoverCondition
 */

// =====================================================================================
// 1. AUTH & USERS
// =====================================================================================

/**
 * @typedef {Object} User
 * @property {number} UserID - Khóa chính định danh người dùng (INT IDENTITY)
 * @property {string} FullName - Họ và tên đầy đủ của người dùng (NVARCHAR 100)
 * @property {string} Email - Địa chỉ email duy nhất dùng để đăng nhập (VARCHAR 100 UNIQUE)
 * @property {string} PasswordHash - Mã băm mật khẩu bảo mật (VARCHAR 255)
 * @property {string | null} [PhoneNumber] - Số điện thoại liên hệ (VARCHAR 30, NULL)
 * @property {UserRole} Role - Vai trò phân quyền trong hệ thống (VARCHAR 30)
 * @property {boolean} IsActive - Trạng thái hoạt động của tài khoản (BIT)
 * @property {string} CreatedAt - Thời điểm tạo tài khoản theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 2. RACEHORSE
// =====================================================================================

/**
 * @typedef {Object} Horse
 * @property {number} HorseID - Khóa chính định danh hồ sơ ngựa đua (INT IDENTITY)
 * @property {number} OwnerUserID - Khóa ngoại liên kết tới auth.Users(UserID) của chủ sở hữu
 * @property {string} Name - Tên định danh của ngựa đua (NVARCHAR 100)
 * @property {string} MicrochipNumber - Mã vi mạch sinh trắc học cấy dưới da RFID (VARCHAR 30 UNIQUE)
 * @property {string} PassportNumber - Số hộ chiếu vận chuyển FEI quốc tế (VARCHAR 50 UNIQUE)
 * @property {string} Breed - Giống loài ngựa, mặc định Thoroughbred (NVARCHAR 50)
 * @property {HorseGender} Gender - Giới tính của ngựa: Stallion, Mare, Gelding (VARCHAR 10)
 * @property {string} DateOfBirth - Ngày sinh của ngựa định dạng YYYY-MM-DD (DATE)
 * @property {string} Color - Màu sắc lông của ngựa (NVARCHAR 30)
 * @property {string | null} [SpecialCareRequirements] - Yêu cầu chế độ chăm sóc, đệm rơm hoặc nhiệt độ cabin (NVARCHAR MAX, NULL)
 * @property {string | null} [PhotoUrl] - Đường dẫn ảnh chụp nhận diện ngựa (NVARCHAR 500, NULL)
 * @property {boolean} IsActive - Trạng thái hồ sơ ngựa còn hiệu lực hay không (BIT)
 * @property {string} CreatedAt - Thời điểm đăng ký hồ sơ theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 3. BOOKING (FLOW 1)
// =====================================================================================

/**
 * @typedef {Object} BookingRequest
 * @property {number} BookingID - Khóa chính định danh yêu cầu đặt chuyến (INT IDENTITY)
 * @property {string} BookingCode - Mã nghiệp vụ của đơn đặt chuyến ví dụ: BKG-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} CustomerUserID - Khóa ngoại liên kết auth.Users(UserID) của khách hàng tạo đơn
 * @property {string} PickupAddress - Địa chỉ chi tiết điểm đón/nhận ngựa (NVARCHAR 255)
 * @property {string} PickupCountryCode - Mã quốc gia điểm đón chuẩn ISO-2 ví dụ: VN (CHAR 2)
 * @property {string} DropoffAddress - Địa chỉ chi tiết điểm trả/giao ngựa (NVARCHAR 255)
 * @property {string} DropoffCountryCode - Mã quốc gia điểm trả chuẩn ISO-2 ví dụ: CN, TH (CHAR 2)
 * @property {string} DepartureDate - Thời gian dự kiến xuất phát theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string} DeliveryDate - Thời gian dự kiến giao ngựa theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {number} TotalHorses - Tổng số lượng ngựa trong chuyến vận chuyển (> 0) (INT)
 * @property {string | null} [SpecialInstructions] - Ghi chú hướng dẫn đặc biệt cho chuyến đi (NVARCHAR MAX, NULL)
 * @property {number} EstimatedCost - Chi phí dự tính ban đầu (DECIMAL 18,2)
 * @property {string} CurrencyCode - Đơn vị tiền tệ thanh toán, mặc định USD (CHAR 3)
 * @property {BookingStatus} Status - Trạng thái xử lý của đơn: Submitted, Approved, Assigned, Completed, Rejected, Expired, Cancelled
 * @property {TransportMode} TransportMode - Phương thức vận chuyển: Ground hoặc Air (VARCHAR 10)
 * @property {number | null} [DistanceKm] - Quãng đường tính cước tính bằng km (INT, NULL cho Air)
 * @property {boolean} IsExpress - Đơn chuyển phát hỏa tốc / gấp dưới 7 ngày (BIT)
 * @property {boolean} RequiresClimateControl - Yêu cầu xe thùng có điều hòa nhiệt độ (BIT)
 * @property {number | null} [DeclaredValue] - Giá trị khai báo bảo hiểm (DECIMAL 18,2, NULL nếu không mua)
 * @property {string | null} [QuoteBreakdown] - Chi tiết các dòng báo giá lưu dưới dạng chuỗi JSON (NVARCHAR MAX, NULL)
 * @property {string | null} [RejectionReason] - Lý do từ chối nếu đơn bị Reject (NVARCHAR 500, NULL)
 * @property {number | null} [ReviewedByUserID] - Khóa ngoại auth.Users(UserID) của Manager duyệt/từ chối đơn (INT, NULL)
 * @property {string | null} [ReviewedAt] - Thời điểm phê duyệt/từ chối đơn (DATETIMEOFFSET, NULL)
 * @property {number | null} [AssignedSpecialistID] - Khóa ngoại auth.Users(UserID) của Specialist được phân công kiểm dịch (INT, NULL)
 * @property {number | null} [AssignedCoordinatorID] - Khóa ngoại auth.Users(UserID) của Coordinator được phân công điều phối (INT, NULL)
 * @property {string} CreatedAt - Thời điểm tạo yêu cầu đặt chuyến theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * Alias tương thích ngược cho các service layer hiện hành.
 * @typedef {BookingRequest} Booking
 */

/**
 * @typedef {Object} BookingHorse
 * @property {number} BookingHorseID - Khóa chính định danh liên kết giữa đơn booking và ngựa (INT IDENTITY)
 * @property {number} BookingID - Khóa ngoại liên kết tới booking.BookingRequests(BookingID)
 * @property {number} HorseID - Khóa ngoại liên kết tới racehorse.Horses(HorseID)
 * @property {StallClass} StallClass - Hạng chuồng phân bổ: Shared, Comfort, Private (VARCHAR 10)
 * @property {string | null} [Notes] - Ghi chú vị trí chuồng hoặc hướng dẫn đặc biệt cho cá thể ngựa (NVARCHAR 300, NULL)
 * @property {BookingHorseStatus} Status - Trạng thái của ngựa trong đơn: Pending, Approved, Cancelled (VARCHAR 20)
 */

// =====================================================================================
// 4. CLEARANCE & DOSSIERS (FLOW 2)
// =====================================================================================

/**
 * @typedef {Object} DocumentType
 * @property {number} DocTypeID - Khóa chính danh mục loại giấy tờ kiểm dịch (INT IDENTITY)
 * @property {string} Code - Mã định danh giấy tờ duy nhất ví dụ: HORSE_PASSPORT, COGGINS_EIA (VARCHAR 30 UNIQUE)
 * @property {string} Name - Tên hiển thị của loại giấy tờ (NVARCHAR 100)
 * @property {string | null} [Description] - Mô tả chi tiết mục đích và cơ quan cấp phép (NVARCHAR 255, NULL)
 * @property {boolean} IsMandatory - Đánh dấu giấy tờ bắt buộc hay tùy chọn (BIT)
 */

/**
 * @typedef {Object} CountryDocRequirement
 * @property {number} RequirementID - Khóa chính quy định giấy tờ theo quốc gia (INT IDENTITY)
 * @property {string} CountryCode - Mã quốc gia 2 chữ cái ví dụ: VN, CN, FR (CHAR 2)
 * @property {'Export' | 'Import'} Direction - Chiều di chuyển: Xuất khẩu hoặc Nhập khẩu (VARCHAR 10)
 * @property {number} DocTypeID - Khóa ngoại liên kết tới clearance.DocumentTypes(DocTypeID)
 * @property {number | null} [ValidityDays] - Số ngày giấy tờ phải được cấp trước ngày đi (INT, NULL)
 * @property {boolean} IsMandatory - Đánh dấu quy định bắt buộc hay khuyến nghị (BIT)
 * @property {string | null} [RegulationNote] - Trích dẫn quy chuẩn pháp lý thú y (NVARCHAR 255, NULL)
 */

/**
 * @typedef {Object} DigitalDossier
 * @property {number} DossierID - Khóa chính định danh bộ hồ sơ kiểm dịch thông quan (INT IDENTITY)
 * @property {string} DossierCode - Mã nghiệp vụ của hồ sơ ví dụ: DOS-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} BookingHorseID - Khóa ngoại liên kết 1-1 tới booking.BookingHorses(BookingHorseID) (INT UNIQUE)
 * @property {number} SpecialistUserID - Khóa ngoại auth.Users(UserID) của Chuyên viên kiểm dịch phụ trách
 * @property {DossierStatus} Status - Trạng thái hồ sơ: Draft, AwaitingDocs, Reviewing, SubmittedToAuthorities, Cleared, Issue
 * @property {string | null} [ClearanceNumber] - Số hiệu chứng nhận thông quan / kiểm dịch thú y cấp phép (VARCHAR 50, NULL)
 * @property {string | null} [IssueReason] - Lý do vướng mắc thủ tục hoặc hồ sơ bị từ chối nếu có (NVARCHAR MAX, NULL)
 * @property {string | null} [ClearedAt] - Thời điểm cơ quan chức năng chính thức thông quan (DATETIMEOFFSET, NULL)
 * @property {string} CreatedAt - Thời điểm tạo hồ sơ theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * Alias tương thích ngược cho các service layer hiện hành.
 * @typedef {DigitalDossier} Dossier
 */

/**
 * @typedef {Object} DossierDocument
 * @property {number} DocumentID - Khóa chính định danh tài liệu đính kèm (INT IDENTITY)
 * @property {number} DossierID - Khóa ngoại liên kết tới clearance.DigitalDossiers(DossierID)
 * @property {number} DocTypeID - Khóa ngoại liên kết tới clearance.DocumentTypes(DocTypeID)
 * @property {string | null} [DocumentNumber] - Số hiệu ghi trên văn bản chứng nhận (VARCHAR 100, NULL)
 * @property {string} FileUrl - Đường dẫn tệp tin PDF/ảnh lưu trữ trên cloud (NVARCHAR 500)
 * @property {number} UploadedByUserID - Khóa ngoại auth.Users(UserID) của người tải lên tài liệu
 * @property {string} UploadedAt - Thời điểm tải lên hệ thống (DATETIMEOFFSET)
 * @property {DocumentStatus} Status - Trạng thái thẩm định: Pending, Approved, Rejected (VARCHAR 20)
 * @property {string | null} [CorrectionNote] - Ghi chú yêu cầu chỉnh sửa/bổ sung của chuyên viên (NVARCHAR 500, NULL)
 * @property {string | null} [ExpiryDate] - Ngày hết hạn hiệu lực của giấy chứng nhận y tế (DATE, NULL)
 * @property {number} RejectionCount - Số lần tài liệu bị từ chối (tối đa 3 lần theo quy định) (INT)
 * @property {number | null} [ReviewedByUserID] - Khóa ngoại auth.Users(UserID) của Chuyên viên thẩm định (INT, NULL)
 * @property {string | null} [ReviewedAt] - Thời điểm thẩm định hồ sơ (DATETIMEOFFSET, NULL)
 */

// =====================================================================================
// 5. FLEET, TRIPS & CHECKPOINTS (FLOW 3)
// =====================================================================================

/**
 * @typedef {Object} TransportAsset
 * @property {number} AssetID - Khóa chính định danh phương tiện xe chuyên dụng (INT IDENTITY)
 * @property {string} AssetCode - Biển số xe hoặc mã định danh tài sản ví dụ: 29B-888.99 (VARCHAR 30 UNIQUE)
 * @property {AssetType} AssetType - Loại phương tiện: HorseTruck_AirSuspension, HorseVan, AirStall (VARCHAR 30)
 * @property {number} CapacityHorses - Sức chứa tối đa số lượng ngựa từ 1 đến 12 (INT)
 * @property {boolean} HasClimateControl - Trang bị hệ thống điều hòa khí hậu cabin (BIT)
 * @property {boolean} HasGpsTracker - Trang bị thiết bị định vị GPS hành trình (BIT)
 * @property {AssetStatus} Status - Trạng thái hoạt động: Available, InTransit, Maintenance (VARCHAR 20)
 * @property {string | null} [LastSanitizationDate] - Thời điểm phun khử trùng gần nhất (DATETIMEOFFSET, NULL)
 */

/**
 * @typedef {Object} TripCrew
 * @property {number} TripCrewID - Khóa chính định danh nhân sự phục vụ chuyến đi (INT IDENTITY)
 * @property {number} TripID - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} UserID - Khóa ngoại liên kết tới auth.Users(UserID)
 * @property {CrewRole} CrewRole - Vai trò nhân sự: Driver hoặc Escort (VARCHAR 10)
 * @property {boolean} IsLead - Đánh dấu là Tài xế chính hoặc Trưởng nhóm áp tải (BIT)
 * @property {string | null} [Duty] - Nhiệm vụ cụ thể ví dụ: nhận ngựa tại trại, chăm sóc trên chuyến bay (NVARCHAR 200, NULL)
 */

/**
 * @typedef {Object} Trip
 * @property {number} TripID - Khóa chính định danh chuyến vận chuyển thực tế (INT IDENTITY)
 * @property {string} TripCode - Mã nghiệp vụ chuyến đi ví dụ: TRP-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} [BookingID] - @deprecated Quan hệ Đơn - Chuyến là N-N qua TripHorses trong Script 04 (INT, NULL)
 * @property {number} VehicleID - Khóa ngoại liên kết tới fleet.TransportAssets(AssetID)
 * @property {number} [DriverID] - @deprecated Đã chuyển sang bảng TripCrew trong Script 04 (INT, NULL)
 * @property {number} [EscortID] - @deprecated Đã chuyển sang bảng TripCrew trong Script 04 (INT, NULL)
 * @property {number | null} [PlannedByUserID] - Khóa ngoại auth.Users(UserID) của Coordinator lập kế hoạch chuyến (INT, NULL)
 * @property {number | null} [ApprovedByUserID] - Khóa ngoại auth.Users(UserID) của Manager duyệt kế hoạch (INT, NULL)
 * @property {string | null} [ApprovedAt] - Thời điểm Manager duyệt kế hoạch chuyến (DATETIMEOFFSET, NULL)
 * @property {number} [PlanRejectionCount] - Số lần kế hoạch bị trả về chỉnh sửa tối đa 3 lần (INT)
 * @property {string | null} [PlanRejectionReason] - Lý do Manager từ chối kế hoạch chuyến (NVARCHAR 500, NULL)
 * @property {string} PlannedStartDate - Kế hoạch thời gian khởi hành theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string} PlannedEndDate - Kế hoạch thời gian đến đích theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string | null} [ActualStartDate] - Thời gian thực tế xe lăn bánh bắt đầu chuyến đi (DATETIMEOFFSET, NULL)
 * @property {string | null} [ActualEndDate] - Thời gian thực tế kết thúc chuyến đi (DATETIMEOFFSET, NULL)
 * @property {number} PlannedCost - Chi phí dự toán cho toàn bộ hành trình (DECIMAL 18,2)
 * @property {number} ActualCost - Chi phí thực tế quyết toán (DECIMAL 18,2)
 * @property {TripStatus} OverallStatus - Trạng thái vận hành tổng thể: Draft, PendingApproval, Scheduled, InTransit, EmergencyRerouting, ArrivedDestination, Completed, Cancelled
 * @property {number} DelayMinutes - Số phút trễ so với kế hoạch ban đầu, mặc định 0 (INT)
 * @property {string} OnTimeStatus - Đánh giá tiến độ ví dụ: OnTime, Delayed (VARCHAR 30)
 * @property {number} KPIScore - Điểm đánh giá chỉ số hiệu suất chuyến đi, mặc định 100.00 (DECIMAL 5,2)
 * @property {number | null} [ClosedByUserID] - Khóa ngoại auth.Users(UserID) của Quản lý nghiệm thu đóng chuyến (INT, NULL)
 * @property {string | null} [ClosedAt] - Thời điểm chính thức nghiệm thu đóng chuyến (DATETIMEOFFSET, NULL)
 * @property {string | null} [ExecutiveRemarks] - Đánh giá nhận xét của ban quản lý (NVARCHAR MAX, NULL)
 * @property {string} CreatedAt - Thời điểm khởi tạo chuyến đi theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * @typedef {Object} TripHorse
 * @property {number} TripHorseID - Khóa chính định danh phân bổ ngựa vào khoang xe (INT IDENTITY)
 * @property {number} TripID - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} BookingHorseID - Khóa ngoại liên kết tới booking.BookingHorses(BookingHorseID)
 * @property {number} StallSlotNumber - Vị trí số chuồng chỉ định trên xe (INT)
 * @property {string | null} [Notes] - Ghi chú bổ sung trong quá trình xếp chuồng (NVARCHAR 200, NULL)
 */

/**
 * @typedef {Object} RouteCheckpoint
 * @property {number} CheckpointID - Khóa chính định danh trạm dừng mốc lộ trình (INT IDENTITY)
 * @property {number} TripID - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} SequenceOrder - Thứ tự mốc dừng trên lộ trình 1, 2, 3... (INT)
 * @property {string} CheckpointName - Tên trạm dừng hoặc cửa khẩu (NVARCHAR 100)
 * @property {CheckpointType} CheckpointType - Loại trạm dừng: Origin, RestStop, BorderGate, Destination (VARCHAR 30)
 * @property {string} Address - Địa chỉ chi tiết của trạm dừng (NVARCHAR 255)
 * @property {string} PlannedTime - Thời gian dự kiến đến trạm theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {number} MandatoryRestMinutes - Thời gian nghỉ bắt buộc tối thiểu cho ngựa tính bằng phút (INT)
 * @property {string | null} [ActualArrivalTime] - Giờ thực tế xe check-in đến trạm (DATETIMEOFFSET, NULL)
 * @property {string | null} [ActualDepartureTime] - Giờ thực tế xe check-out rời trạm (DATETIMEOFFSET, NULL)
 * @property {CheckpointStatus} Status - Trạng thái trạm dừng: Pending, Arrived, Cleared, Departed, Cancelled (VARCHAR 20)
 * @property {boolean} IsActive - Trạng thái hiệu lực của trạm dừng khi nắn tuyến (BIT)
 */

// =====================================================================================
// 6. TRACKING & WELFARE (FLOW 4)
// =====================================================================================

/**
 * @typedef {Object} HorseWelfareLog
 * @property {number} LogID - Khóa chính định danh nhật ký phúc lợi ngựa (INT IDENTITY)
 * @property {number} TripHorseID - Khóa ngoại liên kết tới fleet.TripHorses(TripHorseID)
 * @property {number | null} [CheckpointID] - Khóa ngoại liên kết tới fleet.RouteCheckpoints(CheckpointID) nếu ghi nhận tại trạm (INT, NULL)
 * @property {number} RecordedByUserID - Khóa ngoại auth.Users(UserID) của Chuyên viên/Tài xế ghi nhận
 * @property {number} CabinTemp - Nhiệt độ cabin đo thực tế tại vị trí chuồng tính bằng °C (DECIMAL 4,1)
 * @property {number} WaterIntakeLiters - Lượng nước đã uống tính bằng lít (DECIMAL 4,1)
 * @property {FeedStatus} FeedStatus - Trạng thái ăn uống: Normal, Reduced, Refused (VARCHAR 20)
 * @property {StressLevel} StressLevel - Mức độ stress thể trạng: Calm, MildStress, Agitated (VARCHAR 20)
 * @property {string | null} [Notes] - Ghi chú quan sát biểu hiện thể trạng ngựa (NVARCHAR MAX, NULL)
 * @property {string | null} [PhotoUrl] - Ảnh chụp thể trạng ngựa thực tế tại thời điểm kiểm tra (NVARCHAR 500, NULL)
 * @property {string} LoggedAt - Thời điểm ghi log theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 7. INCIDENTS (FLOW 5)
// =====================================================================================

/**
 * @typedef {Object} TripIncident
 * @property {number} IncidentID - Khóa chính định danh sự cố phát sinh trên đường (INT IDENTITY)
 * @property {string} IncidentCode - Mã nghiệp vụ sự cố ví dụ: INC-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} TripID - Khóa ngoại liên kết tới fleet.Trips(TripID) gặp sự cố
 * @property {number} ReportedByUserID - Khóa ngoại auth.Users(UserID) của tài xế/người báo cáo
 * @property {IncidentType} IncidentType - Loại sự cố: MechanicalBreakdown, BorderCongestion, EquineHealthIssue, Weather, ClimateControlFailure, CustomsHold, Other
 * @property {IncidentSeverity} Severity - Mức độ nghiêm trọng: Minor, Moderate, Major, Critical (VARCHAR 10)
 * @property {number | null} [AffectedTripHorseID] - Khóa ngoại liên kết tới cá thể ngựa bị ảnh hưởng nếu có (INT, NULL)
 * @property {string} Description - Mô tả chi tiết diễn biến sự cố (NVARCHAR MAX)
 * @property {string} Location - Vị trí địa lý nơi xảy ra sự cố (NVARCHAR 255)
 * @property {string | null} [ProposedAction] - Phương án xử lý và ứng phó đề xuất (NVARCHAR 255, NULL)
 * @property {string | null} [RevisedRouteNotes] - Ghi chú chi tiết lộ trình điều chỉnh thay thế (NVARCHAR MAX, NULL)
 * @property {number} AdditionalCost - Chi phí phát sinh dự kiến để khắc phục sự cố (DECIMAL 18,2)
 * @property {IncidentStatus} Status - Trạng thái phê duyệt sự cố: Reported, PlanProposed, Approved, Rejected, Resolved
 * @property {number | null} [ApprovedByUserID] - Khóa ngoại auth.Users(UserID) của Quản lý duyệt phương án (INT, NULL)
 * @property {string | null} [ApprovedAt] - Thời điểm phương án được phê duyệt (DATETIMEOFFSET, NULL)
 * @property {string | null} [ResolvedAt] - Thời điểm hoàn tất xử lý sự cố (DATETIMEOFFSET, NULL)
 * @property {string} ReportedAt - Thời điểm ghi nhận báo cáo sự cố (DATETIMEOFFSET)
 */

/**
 * Alias tương thích ngược cho các service layer hiện hành.
 * @typedef {TripIncident} Incident
 */

// =====================================================================================
// 8. ACCEPTANCE & e-POD (FLOW 6)
// =====================================================================================

/**
 * @typedef {Object} HandoverAcceptance
 * @property {number} HandoverID - Khóa chính biên bản bàn giao và nghiệm thu (INT IDENTITY)
 * @property {number} TripID - Khóa ngoại liên kết 1-1 tới fleet.Trips(TripID) (INT UNIQUE)
 * @property {string} HandoverDateTime - Thời điểm thực hiện ký biên bản giao nhận (DATETIMEOFFSET)
 * @property {string} RecipientName - Họ tên người nhận ngựa tại điểm giao (NVARCHAR 100)
 * @property {string} RecipientPhone - Số điện thoại liên hệ của người nhận (VARCHAR 30)
 * @property {string} RecipientIdCard - Số CMND/CCCD hoặc hộ chiếu của người nhận (VARCHAR 50)
 * @property {string} DigitalSignatureUrl - Đường dẫn hình ảnh chữ ký số e-POD của khách (NVARCHAR 500)
 * @property {HandoverCondition} OverallCondition - Đánh giá thể trạng ngựa khi bàn giao: Excellent, NormalFatigue, Injured (VARCHAR 30)
 * @property {string | null} [Remarks] - Ý kiến nhận xét hoặc biên bản sự vụ nếu có (NVARCHAR MAX, NULL)
 * @property {number} DriverUserID - Khóa ngoại auth.Users(UserID) của tài xế thực hiện bàn giao
 */

// =====================================================================================
// 9. PRICING & PRICE ITEMS (SCRIPT 04)
// =====================================================================================

/**
 * @typedef {Object} PriceItem
 * @property {number} PriceItemID - Khóa chính định danh khoản mục giá (INT IDENTITY)
 * @property {'Freight' | 'StallClass' | 'Surcharge' | 'Discount' | 'Clearance' | 'Escort' | 'Insurance'} Category - Nhóm chi phí
 * @property {string} ItemCode - Mã chi phí ví dụ: FREIGHT, STALL_SHARED, SUR_FUEL (VARCHAR 30)
 * @property {string} ItemName - Tên hiển thị khoản chi phí (NVARCHAR 100)
 * @property {TransportMode | null} [TransportMode] - Áp dụng cho Ground, Air hoặc cả hai (NULL)
 * @property {string | null} [DestCountryCode] - Mã nước đến áp dụng (CHAR 2, NULL nếu áp dụng chung)
 * @property {'PerHorse' | 'PerKmPerHorse' | 'Multiplier' | 'Percent' | 'PerBooking' | 'PerGroom' | 'PerGroomDay'} CalcType - Phương thức tính giá
 * @property {number} Value - Giá trị đơn giá hoặc hệ số nhân (DECIMAL 18,4)
 * @property {number | null} [MinHorses] - Ngưỡng tối thiểu số lượng ngựa áp dụng chiết khấu (INT, NULL)
 * @property {boolean} IsActive - Trạng thái khoản giá đang có hiệu lực hay không (BIT)
 */

// =====================================================================================
// 10. COMMON & NOTIFICATIONS
// =====================================================================================

/**
 * @typedef {Object} SystemNotification
 * @property {number} NotificationID - Khóa chính định danh thông báo hệ thống (BIGINT IDENTITY)
 * @property {number} RecipientUserID - Khóa ngoại auth.Users(UserID) của người nhận thông báo
 * @property {string} Title - Tiêu đề thông báo (NVARCHAR 150)
 * @property {string} Message - Nội dung chi tiết thông báo (NVARCHAR MAX)
 * @property {string | null} [ReferenceType] - Tên đối tượng liên kết ví dụ: Booking, Trip, Dossier, Incident (VARCHAR 50, NULL)
 * @property {number | null} [ReferenceID] - Khóa chính đối tượng liên kết (INT, NULL)
 * @property {boolean} IsRead - Trạng thái đã đọc hay chưa (BIT)
 * @property {string} CreatedAt - Thời điểm tạo thông báo theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

export {};
