<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->onDelete('cascade');

            $table->decimal('amount_paid', 10, 2);
            $table->string('method');
            // bkash, nagad, cash, partial

            $table->enum('status', ['pending', 'completed', 'failed'])
                ->default('completed');

            // Transaction ID from bKash or Nagad
            $table->string('transaction_id')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
