<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('business_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('customer_id')
                ->constrained()
                ->onDelete('cascade');

            // Pre-order flag from the flowchart
            // boolean = true/false, default false (regular order)
            $table->boolean('is_preorder')->default(false);
            $table->text('preorder_note')->nullable();

            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('delivery_charge', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);

            // Order status follows the pipeline from the flowchart
            $table->enum('order_status', [
                'pending',
                'confirmed',
                'packed',
                'shipped',
                'delivered',
                'returned',
                'cancelled',
            ])->default('pending');

            // Payment status
            $table->enum('payment_status', [
                'unpaid',
                'partial',
                'paid',
            ])->default('unpaid');

            // Payment method
            $table->enum('payment_method', [
                'cash_on_delivery',
                'bkash',
                'nagad',
                'partial',
            ])->nullable();

            $table->string('courier_name')->nullable();
            $table->string('source_channel')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
