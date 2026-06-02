<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();

            // Every business belongs to one seller (user)
            // foreignId creates the column + foreign key constraint
            // constrained() links to the users table automatically
            // onDelete('cascade') = if user is deleted, their business is too
            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('name');
            $table->string('facebook_page_id')->nullable();
            // nullable() = this column can be empty (not required)
            $table->string('instagram_id')->nullable();
            $table->string('whatsapp_number')->nullable();
            $table->timestamps();
            // timestamps() creates created_at and updated_at automatically
        });
    }

    public function down(): void
    {
        // down() runs when you rollback the migration
        Schema::dropIfExists('businesses');
    }
};
