'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { useToast } from '@/hooks/use-toast';
import { Camera, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const furnitureItems = PlaceHolderImages.filter(img =>
  img.id.startsWith('ar-')
);

type Furniture = (typeof furnitureItems)[0];

export default function ARView() {
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API is not available in this browser.');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description:
            'Your browser does not support the camera API, which is required for the AR view.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use the AR view.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  return (
    <div className="flex h-full flex-col md:flex-row bg-background">
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r">
        <div className="p-4 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/">
              <ChevronLeft className="mr-2" />
              Back to Home
            </Link>
          </Button>
          <IntraKartLogo variant="icon" size="md" />
        </div>
        <div className="p-4 border-t">
          <h2 className="text-2xl font-bold mb-4">Select Furniture</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              {furnitureItems.map(item => (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedFurniture?.id === item.id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => setSelectedFurniture(item)}
                >
                  <CardHeader className="p-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.description}
                      width={200}
                      height={150}
                      className="w-full h-auto object-cover rounded-t-lg"
                      data-ai-hint={item.imageHint}
                    />
                  </CardHeader>
                  <CardContent className="p-3">
                    <CardTitle className="text-sm font-semibold">
                      {item.description}
                    </CardTitle>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden relative shadow-2xl">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {selectedFurniture && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Image
                src={selectedFurniture.imageUrl}
                alt={selectedFurniture.description}
                width={250}
                height={250}
                className="object-contain opacity-75"
                data-ai-hint={selectedFurniture.imageHint}
              />
            </div>
          )}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                hasCameraPermission ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {hasCameraPermission ? 'Live' : 'Camera Error'}
          </div>
        </div>
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90">
            <div className="text-center p-8">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold">
                Camera Access Needed
              </h2>
              <p className="mt-2 text-muted-foreground">
                To use the AR View, please grant access to your camera in your
                browser settings.
              </p>
              <Alert variant="destructive" className="mt-6 max-w-sm mx-auto">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please check your browser permissions and reload the page.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
        {selectedFurniture && (
          <div className="absolute bottom-8">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setSelectedFurniture(null)}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
