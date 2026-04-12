<?php
$p = json_decode(file_get_contents('tinh_tp.json'), true);
echo "Provinces: " . count($p) . "\n";
$d = json_decode(file_get_contents('quan_huyen.json'), true);
echo "Districts: " . count($d) . "\n";
$w = json_decode(file_get_contents('xa_phuong.json'), true);
echo "Wards: " . count($w) . "\n";
echo "Sample District keys: " . implode(', ', array_keys(array_values($d)[0])) . "\n";
echo "Sample Ward keys: " . implode(', ', array_keys(array_values($w)[0])) . "\n";
