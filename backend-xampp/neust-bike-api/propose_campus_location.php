<?php
/**
 * ==============================================================
 * NEUST BIKEGO - PROPOSE / REGISTER CAMPUS LOCATION (XAMPP PHP)
 * Captures GPS coordinates from smartphone, verifies bounds & duplicates,
 * and records as pending for riders or approved for admins.
 * ==============================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON payload received'
    ]);
    exit();
}

$name               = trim($data['name'] ?? '');
$code               = trim($data['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 4)));
$building_number    = trim($data['buildingNumber'] ?? $data['building_number'] ?? '');
$category           = trim($data['category'] ?? 'academic');
$description        = trim($data['description'] ?? '');
$latitude           = isset($data['latitude']) ? floatval($data['latitude']) : null;
$longitude          = isset($data['longitude']) ? floatval($data['longitude']) : null;
$gps_accuracy       = isset($data['gpsAccuracy']) ? floatval($data['gpsAccuracy']) : (isset($data['gps_accuracy']) ? floatval($data['gps_accuracy']) : null);
$is_pickup_allowed  = isset($data['isPickupAllowed']) ? ($data['isPickupAllowed'] ? 1 : 0) : 1;
$is_dropoff_allowed = isset($data['isDropoffAllowed']) ? ($data['isDropoffAllowed'] ? 1 : 0) : 1;

// Separate stopping point coordinates (Feature 5)
$pickup_lat         = isset($data['pickupLatitude']) ? floatval($data['pickupLatitude']) : $latitude;
$pickup_lng         = isset($data['pickupLongitude']) ? floatval($data['pickupLongitude']) : $longitude;
$dropoff_lat        = isset($data['dropoffLatitude']) ? floatval($data['dropoffLatitude']) : $latitude;
$dropoff_lng        = isset($data['dropoffLongitude']) ? floatval($data['dropoffLongitude']) : $longitude;

$submitted_by       = trim($data['submittedBy'] ?? $data['submitted_by'] ?? 'Campus User');
$role               = trim($data['role'] ?? 'driver');

if (empty($name) || $latitude === null || $longitude === null) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Pangalan ng gusali, latitude, at longitude ay kinakailangan.'
    ]);
    exit();
}

// 1. Validate boundary (Confined strictly to NEUST Sumacab bounds ~15.443 to 15.452 Lat, 120.935 to 120.943 Lng)
if ($latitude < 15.4430 || $latitude > 15.4530 || $longitude < 120.9350 || $longitude > 120.9440) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Ang GPS location ay nasa labas ng campus boundary ng NEUST Sumacab.'
    ]);
    exit();
}

try {
    // 2. Duplicate detection: Check if an existing approved location is within 25 meters or has very similar name
    // Haversine formula in MySQL (6371000 meters Earth radius)
    $dupStmt = $pdo->prepare("SELECT `location_uid`, `location_name`, `latitude`, `longitude`, `status`,
        (6371000 * acos(cos(radians(:lat)) * cos(radians(`latitude`)) * cos(radians(`longitude`) - radians(:lng)) + sin(radians(:lat)) * sin(radians(`latitude`)))) AS distance
        FROM `campus_locations`
        WHERE `status` = 'approved'
        HAVING distance < 25 OR `location_name` LIKE :name
        LIMIT 1");

    $dupStmt->execute([
        ':lat' => $latitude,
        ':lng' => $longitude,
        ':name' => '%' . $name . '%'
    ]);
    $duplicate = $dupStmt->fetch(PDO::FETCH_ASSOC);

    $duplicateWarning = null;
    if ($duplicate) {
        $dist = round(floatval($duplicate['distance']), 1);
        $duplicateWarning = "Pansin: May katabing gusali nang nakarehistro malapit dito: '{$duplicate['location_name']}' (~{$dist}m ang layo).";
    }

    // 3. Determine status: Admins directly approve; riders submit for review
    $status = ($role === 'admin') ? 'approved' : 'pending';
    $approved_by = ($role === 'admin') ? $submitted_by : null;

    $uid = 'loc-custom-' . time() . '-' . rand(100, 999);

    $insert = $pdo->prepare("INSERT INTO `campus_locations`
        (`location_uid`, `code`, `location_name`, `building_number`, `category`, `description`, `latitude`, `longitude`, `pickup_latitude`, `pickup_longitude`, `dropoff_latitude`, `dropoff_longitude`, `gps_accuracy`, `is_pickup_allowed`, `is_dropoff_allowed`, `status`, `submitted_by`, `approved_by`)
        VALUES
        (:uid, :code, :name, :bldg, :cat, :desc, :lat, :lng, :plat, :plng, :dlat, :dlng, :acc, :pallowed, :dallowed, :status, :subby, :appby)");

    $insert->execute([
        ':uid' => $uid,
        ':code' => $code,
        ':name' => $name,
        ':bldg' => $building_number,
        ':cat' => $category,
        ':desc' => $description,
        ':lat' => $latitude,
        ':lng' => $longitude,
        ':plat' => $pickup_lat,
        ':plng' => $pickup_lng,
        ':dlat' => $dropoff_lat,
        ':dlng' => $dropoff_lng,
        ':acc' => $gps_accuracy,
        ':pallowed' => $is_pickup_allowed,
        ':dallowed' => $is_dropoff_allowed,
        ':status' => $status,
        ':subby' => $submitted_by,
        ':appby' => $approved_by
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => ($role === 'admin') 
            ? 'Matagumpay na naitala at naaprubahan ang bagong lokasyon sa campus.' 
            : 'Naisumite na ang lokasyon. Hinihintay na lamang ang pag-apruba ng Administrator.',
        'location_uid' => $uid,
        'location_status' => $status,
        'duplicate_warning' => $duplicateWarning
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

