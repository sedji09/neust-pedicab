<?php
/**
 * ==============================================================
 * NEUST BIKEGO - GET CAMPUS LOCATIONS API (XAMPP PHP)
 * Retrieves approved locations for students or all/pending for admins/riders
 * ==============================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

$status   = isset($_GET['status']) ? trim($_GET['status']) : 'approved'; // 'approved', 'pending', 'all'
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$q        = isset($_GET['q']) ? trim($_GET['q']) : '';

try {
    // 1. Ensure campus_locations table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS `campus_locations` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `location_uid` VARCHAR(60) NOT NULL UNIQUE,
      `code` VARCHAR(20) DEFAULT NULL,
      `location_name` VARCHAR(150) NOT NULL,
      `building_number` VARCHAR(50) DEFAULT NULL,
      `category` ENUM('academic', 'administrative', 'services', 'gate', 'recreation', 'facility') NOT NULL DEFAULT 'academic',
      `description` TEXT DEFAULT NULL,
      `latitude` DECIMAL(10, 7) NOT NULL,
      `longitude` DECIMAL(10, 7) NOT NULL,
      `pickup_latitude` DECIMAL(10, 7) DEFAULT NULL,
      `pickup_longitude` DECIMAL(10, 7) DEFAULT NULL,
      `dropoff_latitude` DECIMAL(10, 7) DEFAULT NULL,
      `dropoff_longitude` DECIMAL(10, 7) DEFAULT NULL,
      `gps_accuracy` DECIMAL(6, 2) DEFAULT NULL,
      `is_pickup_allowed` TINYINT(1) NOT NULL DEFAULT 1,
      `is_dropoff_allowed` TINYINT(1) NOT NULL DEFAULT 1,
      `status` ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'approved',
      `submitted_by` VARCHAR(150) DEFAULT 'System Seed',
      `approved_by` VARCHAR(150) DEFAULT 'Campus Admin',
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (`status`),
      INDEX (`category`),
      INDEX (`location_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $query = "SELECT * FROM `campus_locations` WHERE 1=1";
    $params = [];

    if ($status !== 'all') {
        $query .= " AND `status` = :status";
        $params[':status'] = $status;
    }

    if (!empty($category)) {
        $query .= " AND `category` = :category";
        $params[':category'] = $category;
    }

    if (!empty($q)) {
        $query .= " AND (`location_name` LIKE :q OR `code` LIKE :q OR `building_number` LIKE :q OR `description` LIKE :q)";
        $params[':q'] = '%' . $q . '%';
    }

    $query .= " ORDER BY `location_name` ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $locations = [];
    foreach ($rows as $r) {
        $locations[] = [
            'id' => $r['location_uid'],
            'code' => $r['code'] ?: 'LOC',
            'name' => $r['location_name'],
            'buildingNumber' => $r['building_number'] ?: '',
            'category' => $r['category'],
            'description' => $r['description'] ?: '',
            'coordinates' => [
                'lat' => floatval($r['latitude']),
                'lng' => floatval($r['longitude']),
                'x' => 50.0,
                'y' => 50.0
            ],
            'pickupCoordinates' => $r['pickup_latitude'] ? [
                'lat' => floatval($r['pickup_latitude']),
                'lng' => floatval($r['pickup_longitude'])
            ] : null,
            'dropoffCoordinates' => $r['dropoff_latitude'] ? [
                'lat' => floatval($r['dropoff_latitude']),
                'lng' => floatval($r['dropoff_longitude'])
            ] : null,
            'gpsAccuracy' => $r['gps_accuracy'] ? floatval($r['gps_accuracy']) : null,
            'isPickupActive' => (bool)$r['is_pickup_allowed'],
            'isDropoffAllowed' => (bool)$r['is_dropoff_allowed'],
            'status' => $r['status'],
            'submittedBy' => $r['submitted_by'],
            'approvedBy' => $r['approved_by'],
            'createdAt' => $r['created_at'],
            'waitingCount' => 0,
            'icon' => 'business-outline'
        ];
    }

    echo json_encode([
        'status' => 'success',
        'count' => count($locations),
        'locations' => $locations
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

