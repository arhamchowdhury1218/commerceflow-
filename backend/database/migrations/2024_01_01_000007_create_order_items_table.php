<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // Each item belongs to one order
            $table->foreignId('order_id')
                ->constrained()
                ->onDelete('cascade');

            // Each item is one specific variant
            // Example: Red XL T-shirt (not just "T-shirt")
            $table->foreignId('product_variant_id')
                ->constrained('product_variants')
                ->onDelete('cascade');

            $table->unsignedInteger('quantity');

            // Store the price AT THE TIME of order
            // Product price can change later — we preserve the original price
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            // subtotal = quantity * unit_price (stored for performance)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
