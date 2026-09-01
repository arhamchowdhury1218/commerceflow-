<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained()
                ->onDelete('cascade');

            // 'customer' = message FROM the customer (incoming)
            // 'seller'   = message FROM the seller/page (outgoing reply)
            $table->enum('direction', ['customer', 'seller']);

            // The message text
            $table->text('text')->nullable();

            // Facebook's own message ID (mid) — lets us avoid storing
            // the same incoming message twice if Facebook retries a webhook
            $table->string('fb_message_id')->nullable()->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
