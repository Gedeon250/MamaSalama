import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Navigation } from 'lucide-react';

interface LocationMapDialogProps {
  onSelectLocation?: (location: string) => void;
  trigger?: React.ReactNode;
}

const popularLocations = [
  { name: 'Kenyatta National Hospital', address: 'Hospital Rd, Nairobi' },
  { name: 'Aga Khan University Hospital', address: ' 3rd Parklands Ave, Nairobi' },
  { name: 'Nairobi Hospital', address: 'Argwings Kodhek Rd, Nairobi' },
  { name: 'Gertrude\'s Children\'s Hospital', address: 'Muthaiga Rd, Nairobi' },
  { name: 'MP Shah Hospital', address: 'Shivachi Rd, Nairobi' },
];

export function LocationMapDialog({ onSelectLocation, trigger }: LocationMapDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = () => {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSearchQuery(`${latitude},${longitude}`);
          setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          setDetecting(false);
        },
        () => {
          setDetecting(false);
          setCurrentLocation('Unable to detect location');
        }
      );
    } else {
      setDetecting(false);
      setCurrentLocation('Geolocation not supported');
    }
  };

  const handleSelectLocation = (location: string) => {
    onSelectLocation?.(location);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Find on Map
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Healthcare Facilities</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospitals, clinics..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDetectLocation}
              disabled={detecting}
            >
              <Navigation className={`h-4 w-4 ${detecting ? 'animate-pulse' : ''}`} />
            </Button>
          </div>

          {currentLocation && (
            <p className="text-xs text-muted-foreground">
              Current: {currentLocation}
            </p>
          )}

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(searchQuery || 'hospitals near Kenya')}`}
            />
          </div>

          {/* Popular Locations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Popular Healthcare Facilities</h4>
            <div className="space-y-2">
              {popularLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    setSearchQuery(loc.name);
                    handleSelectLocation(`${loc.name}, ${loc.address}`);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-foreground text-sm">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
