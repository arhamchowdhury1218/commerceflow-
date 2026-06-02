<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();

            // One inventory record per variant
            // unique() ensures only ONE inventory row per variant
            $table->foreignId('product_variant_id')
                ->unique()
                ->constrained('product_variants')
                ->onDelete('cascade');

            $table->unsignedInteger('quantity')->default(0);
            // unsignedInteger = only positive numbers (no negative stock)

            // When stock falls below this number, show low stock warning
            $table->unsignedInteger('low_stock_threshold')->default(5);

            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
