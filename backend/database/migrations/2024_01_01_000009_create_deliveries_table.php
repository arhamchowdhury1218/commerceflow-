<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained()
                ->onDelete('cascade');
            // unique() = one delivery record per order

            $table->string('courier_name');
            // steadfast, pathao, redx, paperfly, own, manual

            // Tracking number returned by SteadFast API
            $table->string('tracking_number')->nullable();

            // Consignment ID from SteadFast API
            $table->string('consignment_id')->nullable();

            $table->enum('delivery_status', [
                'pending',
                'picked_up',
                'in_transit',
                'delivered',
                'returned',
                'cancelled',
            ])->default('pending');

            $table->text('delivery_address')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
