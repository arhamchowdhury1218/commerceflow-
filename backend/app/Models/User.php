<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    // HasApiTokens — gives this model createToken() method for Sanctum

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        // hidden fields are never included in JSON responses
        // protects password from being exposed in API responses
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        // 'hashed' automatically bcrypt hashes password on save
    ];

    // A user (seller) owns one business
    public function business()
    {
        return $this->hasOne(Business::class);
    }
}
