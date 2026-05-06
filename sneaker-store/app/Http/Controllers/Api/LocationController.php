<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Province;
use App\Models\District;
use App\Models\Ward;

class LocationController extends Controller
{
    public function provinces()
    {
        $provinces = Province::orderBy('name')->get(['id', 'code', 'name']);
        return response()->json($provinces);
    }

    public function districts($provinceCode)
    {
        $districts = District::where('province_code', $provinceCode)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'province_code']);
        return response()->json($districts);
    }

    public function wards($districtCode)
    {
        $wards = Ward::where('district_code', $districtCode)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'district_code']);
        return response()->json($wards);
    }
}
