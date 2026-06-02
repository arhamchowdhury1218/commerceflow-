<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();

            // Each variant belongs to one product
            // Example: T-shirt (product) → Red XL (variant), Blue M (variant)
            $table->foreignId('product_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('color')->nullable();
            $table->string('size')->nullable();

            // Variant price can differ from base price
            // Example: XL size costs more than S size
            $table->decimal('price', 10, 2)->nullable();

            // Each variant has its own SKU
            $table->string('sku_variant')->nullable()->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
