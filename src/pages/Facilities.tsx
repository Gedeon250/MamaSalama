import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  MapPin,
  Phone,
  Star,
  Navigation,
  Building2,
  Hospital,
  Pill,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FacilityType = 'all' | 'hospital' | 'clinic' | 'pharmacy';

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  address: string;
  district: string | null;
  phone: string | null;
  rating: number | null;
  is_open: boolean;
  services: string[] | null;
  latitude: number | null;
  longitude: number | null;
}

const typeConfig = {
  hospital: { icon: Hospital, color: 'text-destructive', bg: 'bg-destructive/10' },
  clinic: { icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  pharmacy: { icon: Pill, color: 'text-success', bg: 'bg-success/10' },
};

export default function Facilities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<FacilityType>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['health_facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_facilities')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Facility[];
    },
  });

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  // Calculate approximate distance (Haversine) in km
  function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const facilitiesWithDistance = facilities.map((f) => {
    let distance: string | undefined;
    if (userCoords && f.latitude && f.longitude) {
      const km = distanceKm(userCoords.lat, userCoords.lng, f.latitude, f.longitude);
      distance = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    }
    return { ...f, distance };
  });

  // Sort by distance if we have location
  const sorted = userCoords
    ? [...facilitiesWithDistance].sort((a, b) => {
        if (!a.latitude || !b.latitude) return 0;
        return (
          distanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude!) -
          distanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude!)
        );
      })
    : facilitiesWithDistance;

  const filtered = sorted.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.district ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'all' || f.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <PageLayout title="Nearby Care" showProfile={false}>
      <div className="px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search hospitals, clinics, pharmacies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {(['all', 'hospital', 'clinic', 'pharmacy'] as FacilityType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                activeType === type
                  ? 'gradient-primary text-primary-foreground shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Location Banner */}
        {!userCoords && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Find closest facilities</p>
              <p className="text-xs text-muted-foreground">Share your location to see distances</p>
            </div>
            <Button size="sm" onClick={handleUseLocation} disabled={locating}>
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><Navigation className="w-4 h-4 mr-1" />Locate</>
              )}
            </Button>
          </div>
        )}

        {userCoords && (
          <div className="flex items-center gap-2 text-sm text-success font-medium">
            <Navigation className="w-4 h-4" />
            Sorted by distance from your location
            <button
              onClick={() => setUserCoords(null)}
              className="ml-auto text-muted-foreground hover:text-foreground text-xs"
            >
              Clear
            </button>
          </div>
        )}

        {/* Facilities List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">
              {activeType === 'all' ? 'All Facilities' : activeType.charAt(0).toUpperCase() + activeType.slice(1) + 's'}
              <span className="text-muted-foreground font-normal ml-2">
                ({filtered.length})
              </span>
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

function FacilityCard({ facility }: { facility: Facility & { distance?: string } }) {
  const config = typeConfig[facility.type];
  const Icon = config.icon;

  const directionsUrl =
    facility.latitude && facility.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + ' ' + facility.address)}`;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-full flex-shrink-0', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">{facility.name}</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {facility.type}{facility.district ? ` · ${facility.district}` : ''}
              </p>
            </div>
            {facility.is_open && (
              <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full whitespace-nowrap">
                Open
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{facility.address}</span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            {(facility as Facility & { distance?: string }).distance && (
              <span className="text-sm font-medium text-primary">
                {(facility as Facility & { distance?: string }).distance} away
              </span>
            )}
            {facility.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-medium text-foreground">{facility.rating}</span>
              </div>
            )}
          </div>

          {facility.services && facility.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {facility.services.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
                >
                  {service}
                </span>
              ))}
              {facility.services.length > 3 && (
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                  +{facility.services.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {facility.phone && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`tel:${facility.phone}`}>
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </a>
              </Button>
            )}
            <Button variant="default" size="sm" className="flex-1" asChild>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-1" />
                Directions
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
