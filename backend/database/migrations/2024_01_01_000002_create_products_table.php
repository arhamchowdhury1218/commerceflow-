<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('business_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('name');

            // SKU = Stock Keeping Unit — unique product code
            // unique() ensures no two products have the same SKU
            $table->string('sku')->nullable()->unique();

            $table->decimal('base_price', 10, 2);
            // decimal(10, 2) = up to 10 digits total, 2 after decimal
            // Example: 99999999.99
            // Use decimal for money — never float (float has rounding errors)

            // enum() restricts the value to a specific list
            // prevents invalid values like 'actve' (typo) getting in
            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
