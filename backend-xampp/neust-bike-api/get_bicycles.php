<?php
/**
 * NEUST BikeGo - Get Bicycles / Pedicab Fleet API
 * Endpoint: GET /neust-bike-api/get_bicycles.php
 */
require_once __DIR__ . '/db_connect.php';

try {
    $stmt = $pdo->query("
        SELECT
            b.*,
            u.user_uid AS driver_uid
        FROM bicycles b
        LEFT JOIN users u ON u.assigned_bicycle_number = b.bike_number AND u.role = 'driver'
        ORDER BY b.id ASC
    ");
    $rows = $stmt->fetchAll();

    $bicycles = array_map(function ($row) {
        $bikeNum = $row['bike_number'];
        $idSlug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $bikeNum));
        return [
            'id' => $idSlug,
            'bikeNumber' => $bikeNum,
            'driverId' => $row['driver_uid'] ?: ('driver-' . $idSlug),
            'driverName' => $row['driver_name'],
            'driverPhoto' => $row['driver_photo'] ?: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            'driverPhone' => $row['driver_phone'] ?: '0917-000-0000',
            'passengerCount' => intval($row['passenger_count']),
            'maxCapacity' => intval($row['max_capacity'] ?: 4),
            'status' => $row['status'],
            'currentLocation' => [
                'lat' => floatval($row['lat']),
                'lng' => floatval($row['lng']),
                'x' => 45,
                'y' => 70,
                'stationName' => $row['current_station'] ?: 'NEUST Trike Terminal'
            ],
            'currentDestination' => $row['current_destination'] ?: 'Available for Campus Trips',
            'pickupLocation' => $row['current_station'] ?: 'NEUST Trike Terminal',
            'heading' => 0,
            'speedKmH' => floatval($row['speed_kmh'] ?? 0),
            'lastUpdate' => $row['updated_at'] ?: 'Just now',
            'batteryPercent' => intval($row['battery_percent'] ?? 95)
        ];
    }, $rows);

    echo json_encode([
        'success' => true,
        'bicycles' => $bicycles
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'bicycles' => [],
        'message' => 'Failed to fetch bicycles: ' . $e->getMessage()
    ]);
}

