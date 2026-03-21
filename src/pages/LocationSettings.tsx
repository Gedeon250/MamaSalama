import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search } from 'lucide-react';
import { toast } from 'sonner';

const popularLocations = ['Kigali, Rwanda', 'Butare, Rwanda', 'Gisenyi, Rwanda', 'Ruhengeri, Rwanda', 'Nairobi, Kenya', 'Kampala, Uganda', 'Dar es Salaam, Tanzania'];

export default function LocationSettings() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState(profile?.location || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const country = data.address?.country || '';
          const detected = city && country ? `${city}, ${country}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(detected);
          toast.success('Location detected!');
        } catch {
          toast.error('Could not reverse-geocode location');
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === err.PERMISSION_DENIED) toast.error('Location permission denied');
        else toast.error('Could not detect location');
      },
      { timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!location.trim()) { toast.error('Please enter a location'); return; }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ location: location.trim() }).eq('user_id', profile?.user_id);
    if (error) { toast.error('Failed to save'); } else { await refreshProfile(); toast.success('Location updated!'); navigate('/profile'); }
    setIsSaving(false);
  };

  return (
    <PageLayout title="Location Settings" showBack>
      <div className="px-4 py-6 space-y-6">
        <div className="bg-accent/50 rounded-xl p-4 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <div><p className="text-sm text-muted-foreground">Current Location</p><p className="font-medium text-foreground">{profile?.location || 'Not set'}</p></div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleDetectLocation} disabled={isDetecting}><Navigation className={`w-5 h-5 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />{isDetecting ? 'Detecting...' : 'Detect My Location'}</Button>
        <div className="space-y-2"><Label htmlFor="location">Or enter manually</Label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter city, country" className="pl-10" /></div></div>
        <div><p className="text-sm text-muted-foreground mb-3">Popular locations</p><div className="flex flex-wrap gap-2">{popularLocations.map((loc) => (<button key={loc} onClick={() => setLocation(loc)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${location === loc ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground hover:bg-accent/80'}`}>{loc}</button>))}</div></div>
        <Button onClick={handleSave} className="w-full" size="lg" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Location'}</Button>
      </div>
    </PageLayout>
  );
}
