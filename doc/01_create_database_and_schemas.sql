-- =====================================================================================
-- SCRIPT 01: DATABASE & SCHEMA INITIALIZATION
-- System: Cross-Border Racehorse Transport System (Hệ thống vận chuyển ngựa đua xuyên quốc gia)
-- Target DBMS: Microsoft SQL Server 2019+ / Azure SQL Database
-- Description: Creates the database with Unicode collation and defines 9 modular schemas.
-- =====================================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CrossBorderRacehorseTransportDB')
BEGIN
    CREATE DATABASE CrossBorderRacehorseTransportDB
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT '>> Database [CrossBorderRacehorseTransportDB] created successfully.';
END
ELSE
BEGIN
    PRINT '>> Database [CrossBorderRacehorseTransportDB] already exists.';
END
GO

USE CrossBorderRacehorseTransportDB;
GO

-- =====================================================================================
-- CREATE 9 MODULAR LOGICAL SCHEMAS
-- =====================================================================================

-- 1. auth: User identities, multi-role RBAC, Customer profile, staff credentials
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'auth')
    EXEC('CREATE SCHEMA auth AUTHORIZATION dbo;');
GO

-- 2. racehorse: Thoroughbred horses, ISO microchips, FEI/StudBook passports, care requirements
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'racehorse')
    EXEC('CREATE SCHEMA racehorse AUTHORIZATION dbo;');
GO

-- 3. booking: Service bookings, requested horses, parallel task assignments (Flow 1)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'booking')
    EXEC('CREATE SCHEMA booking AUTHORIZATION dbo;');
GO

-- 4. clearance: Border regulations, required tests, digital dossiers, customs clearance (Flow 2)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'clearance')
    EXEC('CREATE SCHEMA clearance AUTHORIZATION dbo;');
GO

-- 5. fleet: Assets, LTL transport plans, trips & checkpoints (Flow 3)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'fleet')
    EXEC('CREATE SCHEMA fleet AUTHORIZATION dbo;');
GO

-- 6. tracking: Checkpoint checkins, welfare monitoring logs, photos, telemetry (Flow 4)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'tracking')
    EXEC('CREATE SCHEMA tracking AUTHORIZATION dbo;');
GO

-- 7. incident: In-transit emergencies, mitigation rerouting, emergency budgets (Flow 5)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'incident')
    EXEC('CREATE SCHEMA incident AUTHORIZATION dbo;');
GO

-- 8. acceptance: RFID scanning, electronic POD signatures, automated KPI settlements (Flow 6)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'acceptance')
    EXEC('CREATE SCHEMA acceptance AUTHORIZATION dbo;');
GO

-- 9. common: System-wide notifications, currency definitions, and audit trails
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'common')
    EXEC('CREATE SCHEMA common AUTHORIZATION dbo;');
GO

PRINT '>> All 9 modular schemas verified/created successfully in [CrossBorderRacehorseTransportDB].';
GO
