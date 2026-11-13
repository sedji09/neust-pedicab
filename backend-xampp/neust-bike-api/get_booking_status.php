<?php
/**
 * NEUST BikeGo - Get Booking Status API
 * Endpoint: GET /neust-bike-api/get_booking_status.php?id=xxx&bookingNumber=xxx&studentId=xxx
 */
require_once __DIR__ . '/db_connect.php';

$bookingUid = trim($_GET['id'] ?? '');
$bookingNumber = trim($_GET['bookingNumber'] ?? '');
$studentUid = trim($_GET['studentId'] ?? '');

$b = null;
if (!empty($bookingUid) || !empty($bookingNumber)) {
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_uid = ? OR booking_number = ? OR booking_uid = ? OR booking_number = ? LIMIT 1");
    $stmt->execute([$bookingUid, $bookingUid, $bookingNumber, $bookingNumber]);
    $b = $stmt->fetch();
}

// Fallback to student's latest active trip if not found or cancelled
if ((!$b || $b['status'] === 'cancelled') && !empty($studentUid)) {
    // 1. Try active trip in progress or arriving
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE student_uid = ? AND status NOT IN ('completed', 'cancelled') ORDER BY id DESC LIMIT 1");
    $stmt->execute([$studentUid]);
    $activeB = $stmt->fetch();
    if ($activeB) {
        $b = $activeB;
    } else {
        // 2. If no active trip, check for recently completed trip (last 30 mins) so passenger gets the drop-off notice!
        $stmt2 = $pdo->prepare("SELECT * FROM bookings WHERE student_uid = ? AND status = 'completed' AND updated_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) ORDER BY id DESC LIMIT 1");
        $stmt2->execute([$studentUid]);
        $compB = $stmt2->fetch();
        if ($compB) {
            $b = $compB;
        }
    }
}

if (!$b) {
    echo json_encode(['success' => false, 'message' => 'No active booking found.']);
    exit();
}

// Fetch assigned driver avatar if available
$driverPhoto = null;
if (!empty($b['assigned_driver_id'])) {
    $drvStmt = $pdo->prepare("SELECT avatar_url FROM users WHERE user_uid = ? LIMIT 1");
    $drvStmt->execute([$b['assigned_driver_id']]);
    $drvRow = $drvStmt->fetch();
    $driverPhoto = $drvRow['avatar_url'] ?? null;
}

echo json_encode([
    'success' => true,
    'booking' => [
        'id' => $b['booking_uid'],
        'bookingNumber' => $b['booking_number'],
        'studentId' => $b['student_uid'],
        'studentName' => $b['student_name'],
        'studentPhone' => $b['student_phone'],
        'studentIdNumber' => $b['student_id_number'],
        'passengerCount' => max(1, min(4, intval(round(($b['fare_amount'] ?? 10) / 10)))),
        'pickupName' => $b['pickup_name'],
        'pickupLat' => floatval($b['pickup_lat']),
        'pickupLng' => floatval($b['pickup_lng']),
        'pickupInstructions' => $b['pickup_instructions'],
        'destinationName' => $b['destination_name'],
        'destinationLat' => floatval($b['destination_lat']),
        'destinationLng' => floatval($b['destination_lng']),
        'distanceMeters' => intval($b['distance_meters']),
        'estimatedMinutes' => intval($b['estimated_minutes']),
        'fareAmount' => floatval($b['fare_amount']),
        'status' => $b['status'],
        'assignedDriverId' => $b['assigned_driver_id'],
        'assignedDriverName' => $b['assigned_driver_name'],
        'assignedDriverPhone' => $b['assigned_driver_phone'],
        'assignedDriverPhoto' => $driverPhoto,
        'assignedBikeNumber' => $b['assigned_bike_number'],
        'targetDriverId' => $b['target_driver_id'],
        'requestExpiresAt' => $b['request_expires_at'] ? intval($b['request_expires_at']) : null,
        'createdAt' => $b['created_at'],
        'updatedAt' => $b['updated_at']
    ]
]);
