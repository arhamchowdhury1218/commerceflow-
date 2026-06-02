<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('customer_id')
                ->constrained()
                ->onDelete('cascade');

            $table->text('reason')->nullable();

            $table->enum('status', [
                'requested',
                'approved',
                'received',
                'refunded',
            ])->default('requested');

            // Was inventory restored after return?
            $table->boolean('inventory_restored')->default(false);

            $table->decimal('refund_amount', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
