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
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Upload Room Photo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="border-2 border-dashed border-border rounded-3xl p-8 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                Upload your room photo
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Drag & drop or click to select • JPG, PNG up to 10MB
                            </p>
                        </div>
                        <Button variant="outline" type="button">
                            Choose File
                        </Button>
                    </div>
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
