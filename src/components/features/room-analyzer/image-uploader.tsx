import { useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
    onImageSelected: (file: File) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ImageUploader({ onImageSelected, fileInputRef }: ImageUploaderProps) {
    const { toast } = useToast();

    const handleImageUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: 'Please upload an image file.',
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please upload an image smaller than 10MB.',
            });
            return;
        }

        onImageSelected(file);
    }, [toast, onImageSelected]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    }, [handleImageUpload]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            handleImageUpload(file);
        }
    }, [handleImageUpload]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Upload Room Photo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                        Drop your room photo here or click to browse
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Support JPG, PNG files up to 10MB
                    </p>
                    <Button variant="outline">
                        Choose File
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </CardContent>
        </Card>
    );
}
