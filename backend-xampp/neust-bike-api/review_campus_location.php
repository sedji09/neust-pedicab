<?php
/**
 * ==============================================================
 * NEUST BIKEGO - ADMIN REVIEW CAMPUS LOCATION API (XAMPP PHP)
 * Allows administrator to approve, reject, edit, or deactivate a campus location
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

$location_uid     = trim($data['locationUid'] ?? $data['location_uid'] ?? $data['id'] ?? '');
$action           = trim($data['action'] ?? 'approve'); // 'approve', 'reject', 'edit', 'deactivate'
$admin_name       = trim($data['adminName'] ?? $data['admin_name'] ?? 'Administrator');
$rejection_reason = trim($data['rejectionReason'] ?? $data['rejection_reason'] ?? '');

if (empty($location_uid)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Kinakailangan ang location_uid.'
    ]);
    exit();
}

try {
    if ($action === 'approve') {
        $stmt = $pdo->prepare("UPDATE `campus_locations` SET `status` = 'approved', `approved_by` = :admin, `updated_at` = NOW() WHERE `location_uid` = :uid");
        $stmt->execute([':admin' => $admin_name, ':uid' => $location_uid]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Naaprubahan na ang lokasyon. Available na ito sa mga mag-aaral para sa booking.'
        ]);
        exit();
    }

    if ($action === 'reject') {
        $stmt = $pdo->prepare("UPDATE `campus_locations` SET `status` = 'rejected', `description` = CONCAT(IFNULL(`description`, ''), ' [REJECTED: ', :reason, ']'), `updated_at` = NOW() WHERE `location_uid` = :uid");
        $stmt->execute([':reason' => $rejection_reason ?: 'Hindi pasok sa campus criteria', ':uid' => $location_uid]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Tinanggihan ang proposal ng lokasyon.'
        ]);
        exit();
    }

    if ($action === 'deactivate') {
        $stmt = $pdo->prepare("UPDATE `campus_locations` SET `status` = 'inactive', `updated_at` = NOW() WHERE `location_uid` = :uid");
        $stmt->execute([':uid' => $location_uid]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Na-deactivate na ang lokasyon.'
        ]);
        exit();
    }

    if ($action === 'edit') {
        $name        = trim($data['name'] ?? '');
        $lat         = isset($data['latitude']) ? floatval($data['latitude']) : null;
        $lng         = isset($data['longitude']) ? floatval($data['longitude']) : null;
        $pickup_lat  = isset($data['pickupLatitude']) ? floatval($data['pickupLatitude']) : $lat;
        $pickup_lng  = isset($data['pickupLongitude']) ? floatval($data['pickupLongitude']) : $lng;
        $description = trim($data['description'] ?? '');

        $query = "UPDATE `campus_locations` SET `updated_at` = NOW()";
        $params = [':uid' => $location_uid];

        if (!empty($name)) {
            $query .= ", `location_name` = :name";
            $params[':name'] = $name;
        }
        if ($lat !== null && $lng !== null) {
            $query .= ", `latitude` = :lat, `longitude` = :lng";
            $params[':lat'] = $lat;
            $params[':lng'] = $lng;
        }
        if ($pickup_lat !== null && $pickup_lng !== null) {
            $query .= ", `pickup_latitude` = :plat, `pickup_longitude` = :plng";
            $params[':plat'] = $pickup_lat;
            $params[':plng'] = $pickup_lng;
        }
        if (!empty($description)) {
            $query .= ", `description` = :desc";
            $params[':desc'] = $description;
        }

        $query .= " WHERE `location_uid` = :uid";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

        echo json_encode([
            'status' => 'success',
            'message' => 'Matagumpay na na-update ang mga detalye ng lokasyon.'
        ]);
        exit();
    }

    echo json_encode([
        'status' => 'error',
        'message' => 'Hindi kilalang action.'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

