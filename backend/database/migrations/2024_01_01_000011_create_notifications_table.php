<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('customer_id')
                ->constrained()
                ->onDelete('cascade');

            // Which channel was used to notify?
            $table->enum('channel', ['email', 'whatsapp', 'messenger', 'sms']);

            // What type of notification?
            $table->enum('type', [
                'order_received',
                'order_confirmed',
                'order_shipped',
                'order_delivered',
                'order_cancelled',
                'order_returned',
            ]);

            // Was it sent successfully?
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');

            $table->text('message_body')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
