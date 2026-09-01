<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            // Which seller/business this conversation belongs to
            $table->foreignId('business_id')
                ->constrained()
                ->onDelete('cascade');

            // The customer's Facebook-scoped ID (PSID).
            // Facebook gives each person a unique ID per page — this is
            // NOT their real Facebook ID, it's scoped to your page.
            $table->string('psid');

            // Best-effort display name fetched from Facebook (may be null
            // if the profile API call fails or isn't permitted yet)
            $table->string('customer_name')->nullable();

            // Optional link to a Customer record once an order is created
            // from this conversation — lets us connect chats to customers
            $table->foreignId('customer_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // A short preview of the most recent message, for the inbox list
            $table->text('last_message')->nullable();

            // When the last message arrived — used to sort the inbox
            $table->timestamp('last_message_at')->nullable();

            // Whether the seller has read the latest messages
            $table->boolean('is_read')->default(false);

            $table->timestamps();

            // One conversation per (business, customer-PSID) pair
            $table->unique(['business_id', 'psid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
