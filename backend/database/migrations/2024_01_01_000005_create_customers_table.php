<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();

            // Customer belongs to a business
            // Same customer can exist in different businesses
            $table->foreignId('business_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('name');
            $table->string('phone');
            // Email is optional — not all customers give it
            $table->string('email')->nullable();
            $table->text('delivery_address')->nullable();

            // Where did this customer come from?
            // Facebook, Messenger, WhatsApp, Instagram, manual
            $table->string('source_channel')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
