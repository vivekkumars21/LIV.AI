import { NextRequest, NextResponse } from 'next/server';
import { evaluatePlacement, type SpatialInput } from '@/lib/spatial-reasoning';

export async function POST(req: NextRequest) {
    try {
        const body: SpatialInput = await req.json();

        // Validate required fields
        if (!body.room || !body.selectedObject) {
            return NextResponse.json(
                { error: 'Missing required fields: room, selectedObject' },
                { status: 400 }
            );
        }

        if (body.room.width <= 0 || body.room.length <= 0 || body.room.height <= 0) {
            return NextResponse.json(
                { error: 'Room dimensions must be positive numbers (in metres)' },
                { status: 400 }
            );
        }

        if (body.selectedObject.width <= 0 || body.selectedObject.depth <= 0 || body.selectedObject.height <= 0) {
            return NextResponse.json(
                { error: 'Selected object dimensions must be positive numbers (in metres)' },
                { status: 400 }
            );
        }

        // Defaults
        const input: SpatialInput = {
            room: body.room,
            existingObjects: body.existingObjects || [],
            selectedObject: body.selectedObject,
            style: body.style || 'modern',
            budget: body.budget || 100000,
        };

        const result = evaluatePlacement(input);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Spatial reasoning error:', error);
        return NextResponse.json(
            { error: 'Failed to evaluate placement' },
            { status: 500 }
        );
    }
}
