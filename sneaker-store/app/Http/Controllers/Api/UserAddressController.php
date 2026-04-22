<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserAddressController extends Controller
{
    public function index()
    {
        $addresses = UserAddress::where('user_id', Auth::id())
            ->with(['province', 'district', 'ward'])
            ->get();
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'province_id' => 'required|exists:provinces,id',
            'district_id' => 'required|exists:districts,id',
            'ward_id' => 'required|exists:wards,id',
            'address_detail' => 'required|string|max:255',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            UserAddress::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        $address = UserAddress::create([
            'user_id' => Auth::id(),
            ...$validated
        ]);

        return response()->json($address, 201);
    }

    public function update(Request $request, $id)
    {
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'receiver_name' => 'sometimes|required|string|max:255',
            'phone_number' => 'sometimes|required|string|max:20',
            'province_id' => 'sometimes|required|exists:provinces,id',
            'district_id' => 'sometimes|required|exists:districts,id',
            'ward_id' => 'sometimes|required|exists:wards,id',
            'address_detail' => 'sometimes|required|string|max:255',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            UserAddress::where('user_id', Auth::id())->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json($address);
    }

    public function destroy($id)
    {
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }

    public function setDefault($id)
    {
        UserAddress::where('user_id', Auth::id())->update(['is_default' => false]);
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);
        $address->update(['is_default' => true]);

        return response()->json(['message' => 'Default address updated']);
    }
}
