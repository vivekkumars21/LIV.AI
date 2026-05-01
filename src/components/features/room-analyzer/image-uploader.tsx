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
        <Card className="bg-card text-card-foreground border-border/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Camera className="h-5 w-5 text-primary" />
                    Upload Room Photo
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div
                    className="border-2 border-dashed border-border/60 bg-secondary/20 rounded-3xl p-10 text-center hover:border-primary/50 hover:bg-secondary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col items-center gap-5 group"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="p-5 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">
                            Upload your room photo
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                            Drag & drop or click to select
                            <br />
                            <span className="text-xs opacity-80">JPG, PNG up to 10MB</span>
                        </p>
                    </div>
                    <Button variant="default" type="button" className="rounded-full px-6 shadow-sm mt-2 font-semibold">
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
