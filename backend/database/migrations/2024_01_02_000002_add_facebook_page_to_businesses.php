<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // facebook_page_id already exists on the businesses table.
            // We only need to add the Page Access Token column, stored
            // per-business so each seller sends replies from their own page.
            $table->text('facebook_page_token')->nullable()->after('facebook_page_id');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('facebook_page_token');
        });
    }
};
