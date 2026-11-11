<?php
/**
 * ==============================================================
 * NEUST BIKEGO - GET LIVE RIDER TRACKING (XAMPP PHP API)
 * Secure real-time GPS stream for active student booking
 * ==============================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

$booking_id = trim($_GET['booking_id'] ?? $_POST['booking_id'] ?? '');
$student_uid = trim($_GET['student_uid'] ?? $_POST['student_uid'] ?? '');

if (empty($booking_id)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing booking_id parameter'
    ]);
    exit();
}

try {
    // 1. Fetch booking with assigned bicycle details
    $stmt = $pdo->prepare("
        SELECT 
            bk.id,
            bk.booking_uid,
            bk.booking_number,
            bk.student_uid,
            bk.student_name,
            bk.pickup_name,
            bk.pickup_lat,
            bk.pickup_lng,
            bk.destination_name,
            bk.destination_lat,
            bk.destination_lng,
            bk.distance_meters,
            bk.estimated_minutes,
            bk.status,
            bk.assigned_driver_id,
            bk.assigned_driver_name,
            bk.assigned_driver_phone,
            bk.assigned_bike_number,
            b.lat AS driver_lat,
            b.lng AS driver_lng,
            COALESCE(b.heading, 0.0) AS driver_heading,
            COALESCE(b.speed_kmh, 0.0) AS driver_speed_kmh,
            b.driver_photo,
            TIMESTAMPDIFF(SECOND, b.updated_at, NOW()) AS last_gps_seconds_ago
        FROM `bookings` bk
        LEFT JOIN `bicycles` b ON bk.assigned_bike_number = b.bike_number
        WHERE bk.id = :bid OR bk.booking_uid = :buid
        LIMIT 1
    ");

    $stmt->execute([
        ':bid' => $booking_id,
        ':buid' => $booking_id
    ]);

    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Booking not found'
        ]);
        exit();
    }

    // 2. Security validation: Verify student authorization if student_uid is provided
    if (!empty($student_uid) && $booking['student_uid'] !== $student_uid) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Unauthorized: You are not authorized to track this ride'
        ]);
        exit();
    }

    // 3. Stop tracking if trip is completed or cancelled
    $activeStatuses = ['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'];
    $isTrackingActive = in_array($booking['status'], $activeStatuses);

    $secondsAgo = intval($booking['last_gps_seconds_ago'] ?? 0);
    $isSignalLost = $secondsAgo > 45;

    echo json_encode([
        'status' => 'success',
        'tracking_active' => $isTrackingActive,
        'booking' => [
            'id' => $booking['id'],
            'booking_number' => $booking['booking_number'],
            'status' => $booking['status'],
            'distance_meters' => intval($booking['distance_meters']),
            'estimated_minutes' => intval($booking['estimated_minutes']),
            'pickup' => [
                'name' => $booking['pickup_name'],
                'lat' => floatval($booking['pickup_lat']),
                'lng' => floatval($booking['pickup_lng'])
            ],
            'destination' => [
                'name' => $booking['destination_name'],
                'lat' => floatval($booking['destination_lat']),
                'lng' => floatval($booking['destination_lng'])
            ],
            'driver' => [
                'name' => $booking['assigned_driver_name'] ?? 'Campus Driver',
                'phone' => $booking['assigned_driver_phone'] ?? '0917-555-0101',
                'bike_number' => $booking['assigned_bike_number'] ?? 'BIKE-003',
                'photo' => $booking['driver_photo'] ?? null,
                'current_lat' => floatval($booking['driver_lat'] ?? $booking['pickup_lat']),
                'current_lng' => floatval($booking['driver_lng'] ?? $booking['pickup_lng']),
                'heading' => floatval($booking['driver_heading']),
                'speed_kmh' => floatval($booking['driver_speed_kmh']),
                'signal_lost' => $isSignalLost,
                'seconds_since_update' => $secondsAgo
            ]
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

