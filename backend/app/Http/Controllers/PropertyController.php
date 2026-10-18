<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PropertyController extends Controller
{
    private function ensureCanManage(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['admin', 'authority'], true)) {
            return response()->json([
                'message' => 'You are not authorized to manage properties.',
            ], 403);
        }

        return null;
    }

    private function normalizeValue($value)
    {
        if (!is_string($value)) {
            return $value;
        }

        return strtolower(str_replace(
            [' ', '-'],
            '_',
            trim($value)
        ));
    }

    private function normalizePropertyInput(Request $request): void
    {
        $normalized = [];

        foreach (['property_type', 'status'] as $field) {
            if ($request->exists($field)) {
                $normalized[$field] = $this->normalizeValue(
                    $request->input($field)
                );
            }
        }

        if ($normalized) {
            $request->merge($normalized);
        }
    }

    private function propertyRules(bool $updating = false): array
    {
        $sometimes = $updating ? ['sometimes'] : [];

        return [
            'property_code' => [
                ...$sometimes,
                'required',
                'string',
                'max:50',
                Rule::unique('properties', 'property_code')
                    ->ignore(request()->route('property')?->id),
            ],
            'property_name' => [
                ...$sometimes,
                'required',
                'string',
                'max:255',
            ],
            'project_name' => [
                ...$sometimes,
                'nullable',
                'string',
                'max:255',
            ],
            'property_type' => [
                ...$sometimes,
                'required',
                Rule::in([
                    'apartment',
                    'flat',
                    'house',
                    'land',
                    'commercial',
                    'office',
                    'shop',
                    'other',
                ]),
            ],
            'location' => [
                ...$sometimes,
                'required',
                'string',
                'max:2000',
            ],
            'size_sqft' => [
                ...$sometimes,
                'nullable',
                'numeric',
                'gt:0',
            ],
            'price' => [
                ...$sometimes,
                'required',
                'numeric',
                'min:0',
            ],
            'status' => [
                ...$sometimes,
                'required',
                Rule::in([
                    'available',
                    'reserved',
                    'sold',
                    'rented',
                    'under_construction',
                    'unavailable',
                ]),
            ],
            'description' => [
                ...$sometimes,
                'nullable',
                'string',
                'max:10000',
            ],
        ];
    }

    public function index(Request $request)
    {
        $query = Property::query()
            ->with(['creator:id,name', 'images']);

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('property_code', 'like', "%{$search}%")
                    ->orWhere('property_name', 'like', "%{$search}%")
                    ->orWhere('project_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $this->normalizeValue(
                $request->input('status')
            ));
        }

        if ($request->filled('property_type')) {
            $query->where('property_type', $this->normalizeValue(
                $request->input('property_type')
            ));
        }

        return response()->json($query->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        if ($response = $this->ensureCanManage($request)) {
            return $response;
        }

        $this->normalizePropertyInput($request);
        $validated = $request->validate($this->propertyRules());

        $validated['created_by'] = $request->user()->id;
        $property = Property::create($validated);

        return response()->json([
            'message' => 'Property created successfully.',
            'property' => $property->load([
                'creator:id,name',
                'images',
            ]),
        ], 201);
    }

    public function show(Property $property)
    {
        return response()->json([
            'property' => $property->load([
                'creator:id,name',
                'images',
            ]),
        ]);
    }

    public function update(Request $request, Property $property)
    {
        if ($response = $this->ensureCanManage($request)) {
            return $response;
        }

        $this->normalizePropertyInput($request);
        $validated = $request->validate(
            $this->propertyRules(true)
        );

        if (
            ($validated['status'] ?? null) === 'available' &&
            Booking::where('property_id', $property->id)
                ->where('status', 'approved')
                ->exists()
        ) {
            return response()->json([
                'message' => 'This property has an approved booking and cannot be marked available.',
            ], 422);
        }

        $property->update($validated);

        return response()->json([
            'message' => 'Property updated successfully.',
            'property' => $property->fresh()->load([
                'creator:id,name',
                'images',
            ]),
        ]);
    }

    public function uploadImages(Request $request, Property $property)
    {
        if ($response = $this->ensureCanManage($request)) {
            return $response;
        }

        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $savedImages = [];

        try {
            foreach ($validated['images'] as $image) {
                $path = $image->store('properties', 'public');

                if (!$path) {
                    throw new \RuntimeException(
                        'An image could not be saved.'
                    );
                }

                $savedImages[] = PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                    'image_name' => $image->getClientOriginalName(),
                ]);
            }
        } catch (\Throwable $e) {
            foreach ($savedImages as $savedImage) {
                Storage::disk('public')->delete($savedImage->image_path);
                $savedImage->delete();
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Property images uploaded successfully.',
            'images' => collect($savedImages)->map(fn($image) => [
                'id' => $image->id,
                'image_name' => $image->image_name,
                'image_path' => $image->image_path,
                'url' => Storage::disk('public')->url($image->image_path),
            ])->values(),
        ], 201);
    }

    public function deleteImage(
        Request $request,
        Property $property,
        PropertyImage $image
    ) {
        if ($response = $this->ensureCanManage($request)) {
            return $response;
        }

        if ($image->property_id !== $property->id) {
            return response()->json([
                'message' => 'Image does not belong to this property.',
            ], 404);
        }

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return response()->json([
            'message' => 'Property image deleted successfully.',
        ]);
    }

    public function destroy(Request $request, Property $property)
    {
        if ($response = $this->ensureCanManage($request)) {
            return $response;
        }

        $imagePaths = $property->images()
            ->pluck('image_path')
            ->all();

        try {
            $property->delete();
        } catch (QueryException $exception) {
            report($exception);

            return response()->json([
                'message' => 'This property cannot be deleted because it has linked records. Please resolve the related records first.',
            ], 409);
        }

        foreach ($imagePaths as $imagePath) {
            try {
                Storage::disk('public')->delete($imagePath);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json([
            'message' => 'Property deleted successfully.',
        ]);
    }
}
