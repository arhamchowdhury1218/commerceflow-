<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    // GET /api/customers
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        $customers = Customer::where('business_id', $businessId)
            ->withCount('orders')
            // withCount adds an 'orders_count' field to each customer
            ->latest()
            ->get();

        return response()->json($customers);
    }

    // POST /api/customers
    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'phone'            => 'required|string|max:20',
            'email'            => 'nullable|email',
            'delivery_address' => 'nullable|string',
            'source_channel'   => 'nullable|string',
        ]);

        $businessId = $request->user()->business->id;

        $customer = Customer::create([
            'business_id'      => $businessId,
            'name'             => $request->name,
            'phone'            => $request->phone,
            'email'            => $request->email,
            'delivery_address' => $request->delivery_address,
            'source_channel'   => $request->source_channel,
        ]);

        return response()->json($customer, 201);
    }

    // GET /api/customers/{id}
    public function show(Request $request, Customer $customer)
    {
        if ($customer->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Load full order history for this customer
        return response()->json(
            $customer->load(['orders' => function ($q) {
                $q->latest()->limit(10);
            }])
        );
    }

    // PUT /api/customers/{id}
    public function update(Request $request, Customer $customer)
    {
        if ($customer->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $customer->update($request->only([
            'name',
            'phone',
            'email',
            'delivery_address',
            'source_channel'
        ]));

        return response()->json($customer);
    }

    // DELETE /api/customers/{id}
    public function destroy(Request $request, Customer $customer)
    {
        if ($customer->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted']);
    }
}
