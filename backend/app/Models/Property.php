<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $fillable = [
        'property_code',
        'property_name',
        'project_name',
        'property_type',
        'location',
        'size_sqft',
        'price',
        'status',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'size_sqft' => 'decimal:2',
            'price' => 'decimal:2',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }
}