/**
 * @file database.js
 * @description Data contracts and JSDoc typedefs for CrossBorderRacehorseTransportDB (18 tables after review fixes v3).
 * Synchronized 100% with DB Schema and Backend camelCase API contract.
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
 * @property {number} userId - Khóa chính định danh người dùng (INT IDENTITY)
 * @property {string} fullName - Họ và tên đầy đủ của người dùng (NVARCHAR 100)
 * @property {string} email - Địa chỉ email duy nhất dùng để đăng nhập (VARCHAR 100 UNIQUE)
 * @property {string} [passwordHash] - Mã băm mật khẩu bảo mật (VARCHAR 255)
 * @property {string | null} [phoneNumber] - Số điện thoại liên hệ (VARCHAR 30, NULL)
 * @property {UserRole} role - Vai trò phân quyền trong hệ thống (VARCHAR 30)
 * @property {boolean} isActive - Trạng thái hoạt động của tài khoản (BIT)
 * @property {string} createdAt - Thời điểm tạo tài khoản theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 2. RACEHORSE
// =====================================================================================

/**
 * @typedef {Object} Horse
 * @property {number} horseId - Khóa chính định danh hồ sơ ngựa đua (INT IDENTITY)
 * @property {number} ownerUserId - Khóa ngoại liên kết tới auth.Users(UserID) của chủ sở hữu
 * @property {string} name - Tên định danh của ngựa đua (NVARCHAR 100)
 * @property {string} microchipNumber - Mã vi mạch sinh trắc học cấy dưới da RFID (VARCHAR 30 UNIQUE)
 * @property {string} passportNumber - Số hộ chiếu vận chuyển FEI quốc tế (VARCHAR 50 UNIQUE)
 * @property {string} breed - Giống loài ngựa, mặc định Thoroughbred (NVARCHAR 50)
 * @property {HorseGender} gender - Giới tính của ngựa: Stallion, Mare, Gelding (VARCHAR 10)
 * @property {string} dateOfBirth - Ngày sinh của ngựa định dạng YYYY-MM-DD (DATE)
 * @property {string} color - Màu sắc lông của ngựa (NVARCHAR 30)
 * @property {string | null} [specialCareRequirements] - Yêu cầu chế độ chăm sóc, đệm rơm hoặc nhiệt độ cabin (NVARCHAR MAX, NULL)
 * @property {string | null} [photoUrl] - Đường dẫn ảnh chụp nhận diện ngựa (NVARCHAR 500, NULL)
 * @property {boolean} isActive - Trạng thái hồ sơ ngựa còn hiệu lực hay không (BIT)
 * @property {string} createdAt - Thời điểm đăng ký hồ sơ theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 3. BOOKING (FLOW 1)
// =====================================================================================

/**
 * @typedef {Object} BookingRequest
 * @property {number} bookingId - Khóa chính định danh yêu cầu đặt chuyến (INT IDENTITY)
 * @property {string} bookingCode - Mã nghiệp vụ của đơn đặt chuyến ví dụ: BKG-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} customerUserId - Khóa ngoại liên kết auth.Users(UserID) của khách hàng tạo đơn
 * @property {string} pickupAddress - Địa chỉ chi tiết điểm đón/nhận ngựa (NVARCHAR 255)
 * @property {string} pickupCountryCode - Mã quốc gia điểm đón chuẩn ISO-2 ví dụ: VN (CHAR 2)
 * @property {string} dropoffAddress - Địa chỉ chi tiết điểm trả/giao ngựa (NVARCHAR 255)
 * @property {string} dropoffCountryCode - Mã quốc gia điểm trả chuẩn ISO-2 ví dụ: CN, TH (CHAR 2)
 * @property {string} departureDate - Thời gian dự kiến xuất phát theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string} deliveryDate - Thời gian dự kiến giao ngựa theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {number} totalHorses - Tổng số lượng ngựa trong chuyến vận chuyển (> 0) (INT)
 * @property {string | null} [specialInstructions] - Ghi chú hướng dẫn đặc biệt cho chuyến đi (NVARCHAR MAX, NULL)
 * @property {number} estimatedCost - Chi phí dự tính ban đầu (DECIMAL 18,2)
 * @property {string} currencyCode - Đơn vị tiền tệ thanh toán, mặc định USD (CHAR 3)
 * @property {BookingStatus} status - Trạng thái xử lý của đơn: Submitted, Approved, Assigned, Completed, Rejected, Expired, Cancelled
 * @property {TransportMode} transportMode - Phương thức vận chuyển: Ground hoặc Air (VARCHAR 10)
 * @property {number | null} [distanceKm] - Quãng đường tính cước tính bằng km (INT, NULL cho Air)
 * @property {boolean} isExpress - Đơn chuyển phát hỏa tốc / gấp dưới 7 ngày (BIT)
 * @property {boolean} requiresClimateControl - Yêu cầu xe thùng có điều hòa nhiệt độ (BIT)
 * @property {number | null} [declaredValue] - Giá trị khai báo bảo hiểm (DECIMAL 18,2, NULL nếu không mua)
 * @property {string | null} [quoteBreakdown] - Chi tiết các dòng báo giá lưu dưới dạng chuỗi JSON (NVARCHAR MAX, NULL)
 * @property {string | null} [rejectionReason] - Lý do từ chối nếu đơn bị Reject (NVARCHAR 500, NULL)
 * @property {number | null} [reviewedByUserId] - Khóa ngoại auth.Users(UserID) của Manager duyệt/từ chối đơn (INT, NULL)
 * @property {string | null} [reviewedAt] - Thời điểm phê duyệt/từ chối đơn (DATETIMEOFFSET, NULL)
 * @property {number | null} [assignedSpecialistId] - Khóa ngoại auth.Users(UserID) của Specialist được phân công kiểm dịch (INT, NULL)
 * @property {number | null} [assignedCoordinatorId] - Khóa ngoại auth.Users(UserID) của Coordinator được phân công điều phối (INT, NULL)
 * @property {string} createdAt - Thời điểm tạo yêu cầu đặt chuyến theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * Alias tương thích ngược cho các service layer hiện hành.
 * @typedef {BookingRequest} Booking
 */

/**
 * @typedef {Object} BookingHorse
 * @property {number} bookingHorseId - Khóa chính định danh liên kết giữa đơn booking và ngựa (INT IDENTITY)
 * @property {number} bookingId - Khóa ngoại liên kết tới booking.BookingRequests(BookingID)
 * @property {number} horseId - Khóa ngoại liên kết tới racehorse.Horses(HorseID)
 * @property {StallClass} stallClass - Hạng chuồng phân bổ: Shared, Comfort, Private (VARCHAR 10)
 * @property {string | null} [notes] - Ghi chú vị trí chuồng hoặc hướng dẫn đặc biệt cho cá thể ngựa (NVARCHAR 300, NULL)
 * @property {BookingHorseStatus} status - Trạng thái của ngựa trong đơn: Pending, Approved, Cancelled (VARCHAR 20)
 */

// =====================================================================================
// 4. CLEARANCE & DOSSIERS (FLOW 2)
// =====================================================================================

/**
 * @typedef {Object} DocumentType
 * @property {number} docTypeId - Khóa chính danh mục loại giấy tờ kiểm dịch (INT IDENTITY)
 * @property {string} code - Mã định danh giấy tờ duy nhất ví dụ: HORSE_PASSPORT, COGGINS_EIA (VARCHAR 30 UNIQUE)
 * @property {string} name - Tên hiển thị của loại giấy tờ (NVARCHAR 100)
 * @property {string | null} [description] - Mô tả chi tiết mục đích và cơ quan cấp phép (NVARCHAR 255, NULL)
 * @property {boolean} isMandatory - Đánh dấu giấy tờ bắt buộc hay tùy chọn (BIT)
 */

/**
 * @typedef {Object} CountryDocRequirement
 * @property {number} requirementId - Khóa chính quy định giấy tờ theo quốc gia (INT IDENTITY)
 * @property {string} countryCode - Mã quốc gia 2 chữ cái ví dụ: VN, CN, FR (CHAR 2)
 * @property {'Export' | 'Import'} direction - Chiều di chuyển: Xuất khẩu hoặc Nhập khẩu (VARCHAR 10)
 * @property {number} docTypeId - Khóa ngoại liên kết tới clearance.DocumentTypes(DocTypeID)
 * @property {number | null} [validityDays] - Số ngày giấy tờ phải được cấp trước ngày đi (INT, NULL)
 * @property {boolean} isMandatory - Đánh dấu quy định bắt buộc hay khuyến nghị (BIT)
 * @property {string | null} [regulationNote] - Trích dẫn quy chuẩn pháp lý thú y (NVARCHAR 255, NULL)
 */

/**
 * @typedef {Object} DigitalDossier
 * @property {number} dossierId - Khóa chính định danh bộ hồ sơ kiểm dịch thông quan (INT IDENTITY)
 * @property {string} dossierCode - Mã nghiệp vụ của hồ sơ ví dụ: DOS-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} bookingHorseId - Khóa ngoại liên kết 1-1 tới booking.BookingHorses(BookingHorseID) (INT UNIQUE)
 * @property {number} specialistUserId - Khóa ngoại auth.Users(UserID) của Chuyên viên kiểm dịch phụ trách
 * @property {DossierStatus} status - Trạng thái hồ sơ: Draft, AwaitingDocs, Reviewing, SubmittedToAuthorities, Cleared, Issue
 * @property {string | null} [clearanceNumber] - Số hiệu chứng nhận thông quan / kiểm dịch thú y cấp phép (VARCHAR 50, NULL)
 * @property {string | null} [issueReason] - Lý do vướng mắc thủ tục hoặc hồ sơ bị từ chối nếu có (NVARCHAR MAX, NULL)
 * @property {string | null} [clearedAt] - Thời điểm cơ quan chức năng chính thức thông quan (DATETIMEOFFSET, NULL)
 * @property {string} createdAt - Thời điểm tạo hồ sơ theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * Alias tương thích ngược cho các service layer hiện hành.
 * @typedef {DigitalDossier} Dossier
 */

/**
 * @typedef {Object} DossierDocument
 * @property {number} documentId - Khóa chính định danh tài liệu đính kèm (INT IDENTITY)
 * @property {number} dossierId - Khóa ngoại liên kết tới clearance.DigitalDossiers(DossierID)
 * @property {number} docTypeId - Khóa ngoại liên kết tới clearance.DocumentTypes(DocTypeID)
 * @property {string | null} [documentNumber] - Số hiệu ghi trên văn bản chứng nhận (VARCHAR 100, NULL)
 * @property {string} fileUrl - Đường dẫn tệp tin PDF/ảnh lưu trữ trên cloud (NVARCHAR 500)
 * @property {number} uploadedByUserId - Khóa ngoại auth.Users(UserID) của người tải lên tài liệu
 * @property {string} uploadedAt - Thời điểm tải lên hệ thống (DATETIMEOFFSET)
 * @property {DocumentStatus} status - Trạng thái thẩm định: Pending, Approved, Rejected (VARCHAR 20)
 * @property {string | null} [correctionNote] - Ghi chú yêu cầu chỉnh sửa/bổ sung của chuyên viên (NVARCHAR 500, NULL)
 * @property {string | null} [expiryDate] - Ngày hết hạn hiệu lực của giấy chứng nhận y tế (DATE, NULL)
 * @property {number} rejectionCount - Số lần tài liệu bị từ chối (tối đa 3 lần theo quy định) (INT)
 * @property {number | null} [reviewedByUserId] - Khóa ngoại auth.Users(UserID) của Chuyên viên thẩm định (INT, NULL)
 * @property {string | null} [reviewedAt] - Thời điểm thẩm định hồ sơ (DATETIMEOFFSET, NULL)
 */

// =====================================================================================
// 5. FLEET, TRIPS & CHECKPOINTS (FLOW 3)
// =====================================================================================

/**
 * @typedef {Object} TransportAsset
 * @property {number} assetId - Khóa chính định danh phương tiện xe chuyên dụng (INT IDENTITY)
 * @property {string} assetCode - Biển số xe hoặc mã định danh tài sản ví dụ: 29B-888.99 (VARCHAR 30 UNIQUE)
 * @property {AssetType} assetType - Loại phương tiện: HorseTruck_AirSuspension, HorseVan, AirStall (VARCHAR 30)
 * @property {number} capacityHorses - Sức chứa tối đa số lượng ngựa từ 1 đến 12 (INT)
 * @property {boolean} hasClimateControl - Trang bị hệ thống điều hòa khí hậu cabin (BIT)
 * @property {boolean} hasGpsTracker - Trang bị thiết bị định vị GPS hành trình (BIT)
 * @property {AssetStatus} status - Trạng thái hoạt động: Available, InTransit, Maintenance (VARCHAR 20)
 * @property {string | null} [lastSanitizationDate] - Thời điểm phun khử trùng gần nhất (DATETIMEOFFSET, NULL)
 */

/**
 * @typedef {Object} TripCrew
 * @property {number} tripCrewId - Khóa chính định danh nhân sự phục vụ chuyến đi (INT IDENTITY)
 * @property {number} tripId - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} userId - Khóa ngoại liên kết tới auth.Users(UserID)
 * @property {CrewRole} crewRole - Vai trò nhân sự: Driver hoặc Escort (VARCHAR 10)
 * @property {boolean} isLead - Đánh dấu là Tài xế chính hoặc Trưởng nhóm áp tải (BIT)
 * @property {string | null} [duty] - Nhiệm vụ cụ thể ví dụ: nhận ngựa tại trại, chăm sóc trên chuyến bay (NVARCHAR 200, NULL)
 */

/**
 * @typedef {Object} Trip
 * @property {number} tripId - Khóa chính định danh chuyến vận chuyển thực tế (INT IDENTITY)
 * @property {string} tripCode - Mã nghiệp vụ chuyến đi ví dụ: TRP-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} [bookingId] - @deprecated Quan hệ Đơn - Chuyến là N-N qua TripHorses trong Script 04 (INT, NULL)
 * @property {number} vehicleId - Khóa ngoại liên kết tới fleet.TransportAssets(AssetID)
 * @property {number} [driverId] - @deprecated Đã chuyển sang bảng TripCrew trong Script 04 (INT, NULL)
 * @property {number} [escortId] - @deprecated Đã chuyển sang bảng TripCrew trong Script 04 (INT, NULL)
 * @property {number | null} [plannedByUserId] - Khóa ngoại auth.Users(UserID) của Coordinator lập kế hoạch chuyến (INT, NULL)
 * @property {number | null} [approvedByUserId] - Khóa ngoại auth.Users(UserID) của Manager duyệt kế hoạch (INT, NULL)
 * @property {string | null} [approvedAt] - Thời điểm Manager duyệt kế hoạch chuyến (DATETIMEOFFSET, NULL)
 * @property {number} [planRejectionCount] - Số lần kế hoạch bị trả về chỉnh sửa tối đa 3 lần (INT)
 * @property {string | null} [planRejectionReason] - Lý do Manager từ chối kế hoạch chuyến (NVARCHAR 500, NULL)
 * @property {string} plannedStartDate - Kế hoạch thời gian khởi hành theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string} plannedEndDate - Kế hoạch thời gian đến đích theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {string | null} [actualStartDate] - Thời gian thực tế xe lăn bánh bắt đầu chuyến đi (DATETIMEOFFSET, NULL)
 * @property {string | null} [actualEndDate] - Thời gian thực tế kết thúc chuyến đi (DATETIMEOFFSET, NULL)
 * @property {number} plannedCost - Chi phí dự toán cho toàn bộ hành trình (DECIMAL 18,2)
 * @property {number} actualCost - Chi phí thực tế quyết toán (DECIMAL 18,2)
 * @property {TripStatus} overallStatus - Trạng thái vận hành tổng thể: Draft, PendingApproval, Scheduled, InTransit, EmergencyRerouting, ArrivedDestination, Completed, Cancelled
 * @property {number} delayMinutes - Số phút trễ so với kế hoạch ban đầu, mặc định 0 (INT)
 * @property {string} onTimeStatus - Đánh giá tiến độ ví dụ: OnTime, Delayed (VARCHAR 30)
 * @property {number} kpiScore - Điểm đánh giá chỉ số hiệu suất chuyến đi, mặc định 100.00 (DECIMAL 5,2)
 * @property {number | null} [closedByUserId] - Khóa ngoại auth.Users(UserID) của Quản lý nghiệm thu đóng chuyến (INT, NULL)
 * @property {string | null} [closedAt] - Thời điểm chính thức nghiệm thu đóng chuyến (DATETIMEOFFSET, NULL)
 * @property {string | null} [executiveRemarks] - Đánh giá nhận xét của ban quản lý (NVARCHAR MAX, NULL)
 * @property {string} createdAt - Thời điểm khởi tạo chuyến đi theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

/**
 * @typedef {Object} TripHorse
 * @property {number} tripHorseId - Khóa chính định danh phân bổ ngựa vào khoang xe (INT IDENTITY)
 * @property {number} tripId - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} bookingHorseId - Khóa ngoại liên kết tới booking.BookingHorses(BookingHorseID)
 * @property {number} stallSlotNumber - Vị trí số chuồng chỉ định trên xe (INT)
 * @property {string | null} [notes] - Ghi chú bổ sung trong quá trình xếp chuồng (NVARCHAR 200, NULL)
 */

/**
 * @typedef {Object} RouteCheckpoint
 * @property {number} checkpointId - Khóa chính định danh trạm dừng mốc lộ trình (INT IDENTITY)
 * @property {number} tripId - Khóa ngoại liên kết tới fleet.Trips(TripID)
 * @property {number} sequenceOrder - Thứ tự mốc dừng trên lộ trình 1, 2, 3... (INT)
 * @property {string} checkpointName - Tên trạm dừng hoặc cửa khẩu (NVARCHAR 100)
 * @property {CheckpointType} checkpointType - Loại trạm dừng: Origin, RestStop, BorderGate, Destination (VARCHAR 30)
 * @property {string} address - Địa chỉ chi tiết của trạm dừng (NVARCHAR 255)
 * @property {string} plannedTime - Thời gian dự kiến đến trạm theo chuẩn ISO 8601 (DATETIMEOFFSET)
 * @property {number} mandatoryRestMinutes - Thời gian nghỉ bắt buộc tối thiểu cho ngựa tính bằng phút (INT)
 * @property {string | null} [actualArrivalTime] - Giờ thực tế xe check-in đến trạm (DATETIMEOFFSET, NULL)
 * @property {string | null} [actualDepartureTime] - Giờ thực tế xe check-out rời trạm (DATETIMEOFFSET, NULL)
 * @property {CheckpointStatus} status - Trạng thái trạm dừng: Pending, Arrived, Cleared, Departed, Cancelled (VARCHAR 20)
 * @property {boolean} isActive - Trạng thái hiệu lực của trạm dừng khi nắn tuyến (BIT)
 */

// =====================================================================================
// 6. TRACKING & WELFARE (FLOW 4)
// =====================================================================================

/**
 * @typedef {Object} HorseWelfareLog
 * @property {number} logId - Khóa chính định danh nhật ký phúc lợi ngựa (INT IDENTITY)
 * @property {number} tripHorseId - Khóa ngoại liên kết tới fleet.TripHorses(TripHorseID)
 * @property {number | null} [checkpointId] - Khóa ngoại liên kết tới fleet.RouteCheckpoints(CheckpointID) nếu ghi nhận tại trạm (INT, NULL)
 * @property {number} recordedByUserId - Khóa ngoại auth.Users(UserID) của Chuyên viên/Tài xế ghi nhận
 * @property {number} cabinTemp - Nhiệt độ cabin đo thực tế tại vị trí chuồng tính bằng °C (DECIMAL 4,1)
 * @property {number} waterIntakeLiters - Lượng nước đã uống tính bằng lít (DECIMAL 4,1)
 * @property {FeedStatus} feedStatus - Trạng thái ăn uống: Normal, Reduced, Refused (VARCHAR 20)
 * @property {StressLevel} stressLevel - Mức độ stress thể trạng: Calm, MildStress, Agitated (VARCHAR 20)
 * @property {string | null} [notes] - Ghi chú quan sát biểu hiện thể trạng ngựa (NVARCHAR MAX, NULL)
 * @property {string | null} [photoUrl] - Ảnh chụp thể trạng ngựa thực tế tại thời điểm kiểm tra (NVARCHAR 500, NULL)
 * @property {string} loggedAt - Thời điểm ghi log theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

// =====================================================================================
// 7. INCIDENTS (FLOW 5)
// =====================================================================================

/**
 * @typedef {Object} TripIncident
 * @property {number} incidentId - Khóa chính định danh sự cố phát sinh trên đường (INT IDENTITY)
 * @property {string} incidentCode - Mã nghiệp vụ sự cố ví dụ: INC-2026-0001 (VARCHAR 30 UNIQUE)
 * @property {number} tripId - Khóa ngoại liên kết tới fleet.Trips(TripID) gặp sự cố
 * @property {number} reportedByUserId - Khóa ngoại auth.Users(UserID) của tài xế/người báo cáo
 * @property {IncidentType} incidentType - Loại sự cố: MechanicalBreakdown, BorderCongestion, EquineHealthIssue, Weather, ClimateControlFailure, CustomsHold, Other
 * @property {IncidentSeverity} severity - Mức độ nghiêm trọng: Minor, Moderate, Major, Critical (VARCHAR 10)
 * @property {number | null} [affectedTripHorseId] - Khóa ngoại liên kết tới cá thể ngựa bị ảnh hưởng nếu có (INT, NULL)
 * @property {string} description - Mô tả chi tiết diễn biến sự cố (NVARCHAR MAX)
 * @property {string} location - Vị trí địa lý nơi xảy ra sự cố (NVARCHAR 255)
 * @property {string | null} [proposedAction] - Phương án xử lý và ứng phó đề xuất (NVARCHAR 255, NULL)
 * @property {string | null} [revisedRouteNotes] - Ghi chú chi tiết lộ trình điều chỉnh thay thế (NVARCHAR MAX, NULL)
 * @property {number} additionalCost - Chi phí phát sinh dự kiến để khắc phục sự cố (DECIMAL 18,2)
 * @property {IncidentStatus} status - Trạng thái phê duyệt sự cố: Reported, PlanProposed, Approved, Rejected, Resolved
 * @property {number | null} [approvedByUserId] - Khóa ngoại auth.Users(UserID) của Quản lý duyệt phương án (INT, NULL)
 * @property {string | null} [approvedAt] - Thời điểm phương án được phê duyệt (DATETIMEOFFSET, NULL)
 * @property {string | null} [resolvedAt] - Thời điểm hoàn tất xử lý sự cố (DATETIMEOFFSET, NULL)
 * @property {string} reportedAt - Thời điểm ghi nhận báo cáo sự cố (DATETIMEOFFSET)
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
 * @property {number} handoverId - Khóa chính biên bản bàn giao và nghiệm thu (INT IDENTITY)
 * @property {number} tripId - Khóa ngoại liên kết 1-1 tới fleet.Trips(TripID) (INT UNIQUE)
 * @property {string} handoverDateTime - Thời điểm thực hiện ký biên bản giao nhận (DATETIMEOFFSET)
 * @property {string} recipientName - Họ tên người nhận ngựa tại điểm giao (NVARCHAR 100)
 * @property {string} recipientPhone - Số điện thoại liên hệ của người nhận (VARCHAR 30)
 * @property {string} recipientIdCard - Số CMND/CCCD hoặc hộ chiếu của người nhận (VARCHAR 50)
 * @property {string} digitalSignatureUrl - Đường dẫn hình ảnh chữ ký số e-POD của khách (NVARCHAR 500)
 * @property {HandoverCondition} overallCondition - Đánh giá thể trạng ngựa khi bàn giao: Excellent, NormalFatigue, Injured (VARCHAR 30)
 * @property {string | null} [remarks] - Ý kiến nhận xét hoặc biên bản sự vụ nếu có (NVARCHAR MAX, NULL)
 * @property {number} driverUserId - Khóa ngoại auth.Users(UserID) của tài xế thực hiện bàn giao
 */

// =====================================================================================
// 9. PRICING & PRICE ITEMS (SCRIPT 04)
// =====================================================================================

/**
 * @typedef {Object} PriceItem
 * @property {number} priceItemId - Khóa chính định danh khoản mục giá (INT IDENTITY)
 * @property {'Freight' | 'StallClass' | 'Surcharge' | 'Discount' | 'Clearance' | 'Escort' | 'Insurance'} category - Nhóm chi phí
 * @property {string} itemCode - Mã chi phí ví dụ: FREIGHT, STALL_SHARED, SUR_FUEL (VARCHAR 30)
 * @property {string} itemName - Tên hiển thị khoản chi phí (NVARCHAR 100)
 * @property {TransportMode | null} [transportMode] - Áp dụng cho Ground, Air hoặc cả hai (NULL)
 * @property {string | null} [destCountryCode] - Mã nước đến áp dụng (CHAR 2, NULL nếu áp dụng chung)
 * @property {'PerHorse' | 'PerKmPerHorse' | 'Multiplier' | 'Percent' | 'PerBooking' | 'PerGroom' | 'PerGroomDay'} calcType - Phương thức tính giá
 * @property {number} value - Giá trị đơn giá hoặc hệ số nhân (DECIMAL 18,4)
 * @property {number | null} [minHorses] - Ngưỡng tối thiểu số lượng ngựa áp dụng chiết khấu (INT, NULL)
 * @property {boolean} isActive - Trạng thái khoản giá đang có hiệu lực hay không (BIT)
 */

// =====================================================================================
// 10. COMMON & NOTIFICATIONS
// =====================================================================================

/**
 * @typedef {Object} SystemNotification
 * @property {number} notificationId - Khóa chính định danh thông báo hệ thống (BIGINT IDENTITY)
 * @property {number} recipientUserId - Khóa ngoại auth.Users(UserID) của người nhận thông báo
 * @property {string} title - Tiêu đề thông báo (NVARCHAR 150)
 * @property {string} message - Nội dung chi tiết thông báo (NVARCHAR MAX)
 * @property {string | null} [referenceType] - Tên đối tượng liên kết ví dụ: Booking, Trip, Dossier, Incident (VARCHAR 50, NULL)
 * @property {number | null} [referenceId] - Khóa chính đối tượng liên kết (INT, NULL)
 * @property {boolean} isRead - Trạng thái đã đọc hay chưa (BIT)
 * @property {string} createdAt - Thời điểm tạo thông báo theo chuẩn ISO 8601 (DATETIMEOFFSET)
 */

export {};
