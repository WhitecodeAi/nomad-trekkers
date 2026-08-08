import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { apiService, fortHelpers, Fort } from "@/lib/api";
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  Mountain, 
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  Shield,
  Calendar,
  Users,
  ArrowRight,
  Loader2,
  RefreshCw
} from "lucide-react";

export default function Forts() {
  const [forts, setForts] = useState<Fort[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [ratingFilter, setRatingFilter] = useState([0]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "elevation" | "rating" | "difficulty" | "reviews">("name");

  const difficulties = ["Easy", "Moderate", "Difficult", "Expert"];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [fortsResponse, districtsResponse] = await Promise.all([
          apiService.getForts({ sortBy: 'name' }),
          apiService.getDistricts()
        ]);

        let approvedFortsResponse = { data: [] };
        try {
          approvedFortsResponse = await apiService.getApprovedForts();
        } catch (approvedFortsError) {
          console.warn('Failed to fetch approved forts:', approvedFortsError);
          // Continue without approved forts
        }

        // Convert approved fort submissions to Fort format

        // Deduplicate approved forts by fort name to avoid duplicates
        const uniqueApprovedForts = (approvedFortsResponse.data || []).reduce((acc: any[], fortInfo: any) => {
          // Check if we already have a fort with this name
          const existingFort = acc.find(f => f.fort_name === fortInfo.fort_name);
          if (!existingFort) {
            acc.push(fortInfo);
          }
          return acc;
        }, []);

        const approvedForts = uniqueApprovedForts.map((fortInfo: any) => ({
          id: fortInfo.id + 10000, // Ensure unique IDs by adding offset
          name: fortInfo.fort_name,
          location: fortInfo.location,
          district: 'User Submitted', // Could be extracted from location if needed
          difficulty: fortInfo.difficulty || 'Moderate',
          duration: fortInfo.duration || 'Not specified',
          rating: 4.0, // Default rating for user submissions
          reviews: 0, // Start with 0 reviews
          elevation: 1000, // Default elevation
          bestSeason: ['Oct-Mar'], // Default season
          images: {
            main: fortInfo.images && fortInfo.images.length > 0 ?
              `/uploads/fort-images/${fortInfo.images[0]}` : '/placeholder.svg',
            gallery: fortInfo.images ?
              fortInfo.images.map((img: string) => `/uploads/fort-images/${img}`) : []
          },
          description: fortInfo.description || 'User submitted fort information.',
          highlights: [
            'User submitted content',
            ...(fortInfo.best_time_to_visit ? [`Best time: ${fortInfo.best_time_to_visit}`] : []),
            ...(fortInfo.entry_fee ? [`Entry fee: ${fortInfo.entry_fee}`] : [])
          ],
          nearestTown: fortInfo.location.split(',')[0] || 'Not specified',
          distance: 10, // Default distance
          history: 'Historical information submitted by community.',
          architecture: 'Architectural details to be updated.',
          trekRoute: 'Trek route information to be updated.',
          whatToBring: ['Water', 'Comfortable shoes', 'Camera'],
          safetyTips: fortInfo.safety_tips ?
            fortInfo.safety_tips.split(',').map((tip: string) => tip.trim()) :
            ['Follow local guidelines', 'Trek in groups'],
          accessibility: {
            byTrain: 'Contact local guides for transportation details',
            byBus: 'Contact local guides for transportation details',
            byAir: 'Contact local guides for transportation details'
          },
          weather: {
            temperature: '15°C - 30°C',
            rainfall: 'Moderate during monsoon',
            bestTime: fortInfo.best_time_to_visit || 'October to March'
          },
          facilities: {
            parking: fortInfo.facilities ? fortInfo.facilities.includes('parking') : false,
            restrooms: fortInfo.facilities ? fortInfo.facilities.includes('restroom') : false,
            foodStalls: fortInfo.facilities ? fortInfo.facilities.includes('food') : false,
            guides: true // User submitted, so guides are available
          },
          coordinates: {
            latitude: 18.5204, // Default coordinates (can be updated)
            longitude: 73.8567
          },
          timings: '6:00 AM - 6:00 PM',
          entryFee: fortInfo.entry_fee || 'Contact local authorities',
          photography: true,
          createdAt: new Date(fortInfo.submitted_at || Date.now()),
          updatedAt: new Date(fortInfo.updated_at || Date.now())
        }));

        // Combine regular forts with approved fort submissions
        const allForts = [...fortsResponse.data, ...approvedForts];

        setForts(allForts);
        setDistricts(districtsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load forts data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Listen for fort deletion events from admin panel
    const handleFortDeleted = () => {
      console.log('Fort deleted event received, refreshing forts...');
      fetchInitialData();
    };

    window.addEventListener('fortDeleted', handleFortDeleted);

    return () => {
      window.removeEventListener('fortDeleted', handleFortDeleted);
    };
  }, []);

  // Filter and sort forts based on current filters
  const filteredForts = useMemo(() => {
    let filtered = [...forts];

    if (searchTerm) {
      filtered = filtered.filter(fort => 
        fort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fort.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fort.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fort.highlights.some(highlight => 
          highlight.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedDistrict !== "all") {
      filtered = filtered.filter(fort => fort.district === selectedDistrict);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(fort => fort.difficulty === selectedDifficulty);
    }

    if (ratingFilter[0] > 0) {
      filtered = filtered.filter(fort => fort.rating >= ratingFilter[0]);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return b.rating - a.rating;
        case "difficulty":
          const difficultyOrder = { "Easy": 1, "Moderate": 2, "Difficult": 3, "Expert": 4 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case "elevation":
          return b.elevation - a.elevation;
        case "reviews":
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

    return filtered;
  }, [forts, searchTerm, selectedDistrict, selectedDifficulty, ratingFilter, sortBy]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getForts({ sortBy });
      setForts(response.data);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && forts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading forts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && forts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-16">
        {/* Header */}
        <div className="bg-muted/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Explore Historic Forts
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover {forts.length} magnificent forts across Maharashtra. Filter by difficulty, location, and rating to find your perfect adventure.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Filters & Search</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* District Filter */}
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Difficulty Filter */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="elevation">Elevation</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Rating: {ratingFilter[0]}</label>
              <Slider
                value={ratingFilter}
                onValueChange={setRatingFilter}
                max={5}
                min={0}
                step={0.1}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {filteredForts.length} fort{filteredForts.length !== 1 ? 's' : ''} found
              </span>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fort Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForts.map((fort) => (
                <Card key={fort.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 bg-muted overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute top-4 right-4 z-20">
                      <Badge variant="secondary" className="bg-white/90">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {fortHelpers.formatRating(fort.rating)}
                      </Badge>
                    </div>
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className={fortHelpers.getDifficultyColor(fort.difficulty)}>
                        {fort.difficulty}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 z-20 text-white">
                      <h3 className="font-semibold text-lg mb-1">{fort.name}</h3>
                      <div className="flex items-center text-sm opacity-90">
                        <MapPin className="w-3 h-3 mr-1" />
                        {fort.location}
                      </div>
                    </div>
                    {/* Real image from API */}
                    <img 
                      src={fort.images.main} 
                      alt={fort.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Fallback gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-500 opacity-80 -z-10" />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {fort.duration}
                      </div>
                      <div className="flex items-center">
                        <Mountain className="w-4 h-4 mr-1" />
                        {fortHelpers.formatElevation(fort.elevation)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fort.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        {fort.reviews} reviews
                      </div>
                      <Link to={`/fort/${fort.id}`}>
                        <Button size="sm" className="group">
                          Details
                          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForts.map((fort) => (
                <Card key={fort.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-48 h-32 relative overflow-hidden rounded-lg">
                        <img 
                          src={fort.images.main} 
                          alt={fort.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-500 -z-10" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{fort.name}</h3>
                            <div className="flex items-center text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {fort.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={fortHelpers.getDifficultyColor(fort.difficulty)}>
                              {fort.difficulty}
                            </Badge>
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {fortHelpers.formatRating(fort.rating)}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{fort.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {fort.duration}
                          </div>
                          <div className="flex items-center">
                            <Mountain className="w-4 h-4 mr-1" />
                            {fortHelpers.formatElevation(fort.elevation)}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {fort.reviews} reviews
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {fort.highlights.slice(0, 3).map((highlight, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                          <Link to={`/fort/${fort.id}`}>
                            <Button className="group">
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredForts.length === 0 && !loading && (
            <div className="text-center py-12">
              <Mountain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No forts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms to find more results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
