import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import GuideContacts from "@/components/GuideContacts";
import ReviewsSection from "@/components/ReviewsSection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiService, fortHelpers, Fort } from "@/lib/api";
import {
  MapPin,
  Clock,
  Star,
  Mountain,
  Calendar,
  Thermometer,
  Camera,
  Users,
  Navigation as NavigationIcon,
  ArrowLeft,
  Share2,
  Heart,
  AlertTriangle,
  Car,
  Train,
  Plane,
  TreePine,
  CloudRain,
  Sun,
  CheckCircle,
  XCircle,
  Info,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";

export default function FortDetail() {
  const { id } = useParams();
  const [fort, setFort] = useState<Fort | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { user, isAuthenticated } = useAuth();
  const [trekGroups, setTrekGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const fetchFort = async () => {
      if (!id || isNaN(parseInt(id))) {
        setError("Invalid fort ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [fortResponse, groupsResponse] = await Promise.all([
          apiService.getFortById(parseInt(id)),
          fetch("/api/trek-groups").then(res => res.ok ? res.json() : { success: false, groups: [] })
        ]);
        setFort(fortResponse.data);
        if (groupsResponse.success) {
          setTrekGroups(groupsResponse.groups || groupsResponse.data || []);
        }
      } catch (err) {
        console.error("Error fetching fort data:", err);
        setError("Failed to load details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFort();
  }, [id]);

  const handleRefresh = async () => {
    if (!id || isNaN(parseInt(id))) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFortById(parseInt(id));
      setFort(response.data);
    } catch (err) {
      console.error("Error refreshing fort:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const joinTrekGroup = async (groupId: number) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join this trek group.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingGroups(true);
      const response = await fetch(`/api/trek-groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Joined Group!",
            description: "You have successfully joined the trek group.",
          });
          
          // Refresh trek groups
          const groupsResponse = await fetch("/api/trek-groups").then(res => res.ok ? res.json() : { success: false, groups: [] });
          if (groupsResponse.success) {
            setTrekGroups(groupsResponse.groups || groupsResponse.data || []);
          }
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to join group.",
            variant: "destructive",
          });
        }
      } else {
        const errData = await response.json();
        toast({
          title: "Error",
          description: errData.message || "Failed to join group.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error joining group:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading fort details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fort) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Fort not found"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/forts">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Forts
                </Button>
              </Link>
              {error && (
                <Button onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-16">
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10" />
          <img
            src={fort.images.main}
            alt={fort.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-green-600 -z-10" />

          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="flex items-center mb-4">
                <Link to="/forts">
                  <Button variant="secondary" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Forts
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {fort.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {fort.location}
                </div>
                <div className="flex items-center">
                  <Mountain className="h-4 w-4 mr-2" />
                  {fortHelpers.formatElevation(fort.elevation)}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  {fortHelpers.formatRating(fort.rating)} ({fort.reviews}{" "}
                  reviews)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="trek">Trek Info</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="groups">Trek Groups</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {fort.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {fort.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Difficulty Level
                            </span>
                            <Badge
                              className={fortHelpers.getDifficultyColor(
                                fort.difficulty,
                              )}
                            >
                              {fort.difficulty}
                            </Badge>
                          </div>
                          <Progress
                            value={fortHelpers.getDifficultyProgress(
                              fort.difficulty,
                            )}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Trek Duration
                            </span>
                            <span className="text-sm">{fort.duration}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Distance from {fort.nearestTown}
                            </span>
                            <span className="text-sm">
                              {fortHelpers.formatDistance(fort.distance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Key Highlights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {fort.highlights.map((highlight, index) => (
                            <div
                              key={index}
                              className="flex items-center text-sm"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Weather & Best Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Thermometer className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                          <div className="text-sm font-medium">Temperature</div>
                          <div className="text-xs text-muted-foreground">
                            {fort.weather.temperature}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <CloudRain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-sm font-medium">Rainfall</div>
                          <div className="text-xs text-muted-foreground">
                            {fort.weather.rainfall}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <div className="text-sm font-medium">Best Time</div>
                          <div className="text-xs text-muted-foreground">
                            {fort.weather.bestTime}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Recommended Months</h5>
                        <div className="flex flex-wrap gap-2">
                          {fort.bestSeason.map((month, index) => (
                            <Badge key={index} variant="outline">
                              {month}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trek" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trek Route & Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {fort.trekRoute}
                      </p>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold mb-3">What to Bring</h5>
                          <ul className="space-y-2">
                            {fort.whatToBring.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start text-sm"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-3">Safety Tips</h5>
                          <ul className="space-y-2">
                            {fort.safetyTips.slice(0, 6).map((tip, index) => (
                              <li
                                key={index}
                                className="flex items-start text-sm"
                              >
                                <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>How to Reach</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Train className="h-5 w-5 text-blue-600 mt-1" />
                          <div>
                            <div className="font-medium">By Train</div>
                            <div className="text-sm text-muted-foreground">
                              {fort.accessibility.byTrain}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Car className="h-5 w-5 text-green-600 mt-1" />
                          <div>
                            <div className="font-medium">By Bus/Car</div>
                            <div className="text-sm text-muted-foreground">
                              {fort.accessibility.byBus}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Plane className="h-5 w-5 text-purple-600 mt-1" />
                          <div>
                            <div className="font-medium">By Air</div>
                            <div className="text-sm text-muted-foreground">
                              {fort.accessibility.byAir}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical Significance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {fort.history}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Architecture & Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {fort.architecture}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gallery" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Photo Gallery</CardTitle>
                      <CardDescription>
                        Explore stunning views and architectural marvels of{" "}
                        {fort.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Main selected image */}
                      <div className="mb-4">
                        <img
                          src={
                            fort.images.gallery[selectedImageIndex] ||
                            fort.images.main
                          }
                          alt={`${fort.name} - Image ${selectedImageIndex + 1}`}
                          className="w-full h-64 md:h-96 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = fort.images.main;
                          }}
                        />
                      </div>

                      {/* Thumbnail gallery */}
                      <div className="grid grid-cols-4 gap-2">
                        {fort.images.gallery.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative aspect-video rounded-lg overflow-hidden ${
                              selectedImageIndex === index
                                ? "ring-2 ring-primary"
                                : ""
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${fort.name} thumbnail ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-green-500/20" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <ReviewsSection fortName={fort.name} />
                </TabsContent>

                <TabsContent value="groups" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Trek Groups for {fort.name}</CardTitle>
                      <CardDescription>
                        Join an existing trekking group or community plan for this fort.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const matchingGroups = trekGroups.filter((g) =>
                          g.fortName.toLowerCase().includes(fort.name.toLowerCase())
                        );

                        if (matchingGroups.length === 0) {
                          return (
                            <div className="text-center py-12 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <h3 className="text-lg font-semibold mb-2">No Groups Found</h3>
                              <p className="max-w-md mx-auto text-sm mb-6">
                                There are currently no active trek groups scheduled for {fort.name}.
                              </p>
                              <Link to="/trek-planner">
                                <Button className="bg-primary hover:bg-primary/95">
                                  Create a Trek Plan
                                </Button>
                              </Link>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matchingGroups.map((group) => {
                              const isFull = group.currentParticipants >= group.maxParticipants;
                              const isClosed = group.status === "closed" || group.status === "cancelled";
                              
                              return (
                                <div
                                  key={group.id}
                                  className="p-5 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between bg-card"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-base line-clamp-1">{group.title}</h4>
                                      <Badge
                                        variant={isClosed ? "secondary" : isFull ? "destructive" : "default"}
                                        className="text-xs shrink-0 ml-2"
                                      >
                                        {isClosed ? "Closed" : isFull ? "Full" : "Open"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                      {group.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-muted-foreground mb-4 border-t pt-3">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate">{new Date(group.trekDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span>{group.currentParticipants} / {group.maxParticipants} joined</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span>{group.duration || "1 Day"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                        <span className="truncate">{group.organizerName || group.organizer?.name || "Organizer"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 col-span-2">
                                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate">Meeting: {group.meetingPoint || "Base Village"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                          {group.difficulty}
                                        </Badge>
                                        <span className="font-semibold text-primary">
                                          {group.cost === 0 ? "Free" : `₹${group.cost}`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 border-t pt-3 mt-auto">
                                    <Link to={`/trek-groups?groupId=${group.id}&backToFortId=${fort.id}&backToFortName=${encodeURIComponent(fort.name)}`} className="flex-1">
                                      <Button variant="outline" className="w-full text-xs h-9">
                                        View Details
                                      </Button>
                                    </Link>
                                    {!isAuthenticated ? (
                                      <Link to="/login" className="flex-1">
                                        <Button className="w-full text-xs h-9 bg-primary hover:bg-primary/95">
                                          Log in to Join
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Button
                                        onClick={() => joinTrekGroup(group.id)}
                                        disabled={isFull || isClosed || loadingGroups}
                                        className="flex-1 text-xs h-9 bg-primary hover:bg-primary/95"
                                      >
                                        {loadingGroups ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : null}
                                        Join Group
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Entry Fee</span>
                    <span className="text-sm">{fort.entryFee}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Timings</span>
                    <span className="text-sm">{fort.timings}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Photography</span>
                    <span className="text-sm">
                      {fort.photography ? "Allowed" : "Restricted"}
                    </span>
                  </div>

                  <Separator />

                  <div>
                    <h5 className="font-medium mb-2">Available Facilities</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Parking</span>
                        {fort.facilities.parking ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Restrooms</span>
                        {fort.facilities.restrooms ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Food Stalls</span>
                        {fort.facilities.foodStalls ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Local Guides</span>
                        {fort.facilities.guides ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Your Trek</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/trek-planner">
                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Add to Trek Plan
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (fort?.coordinates) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${fort.coordinates.latitude},${fort.coordinates.longitude}&travelmode=driving`;
                        window.open(url, "_blank");
                      } else {
                        const url = `https://www.google.com/maps/search/${encodeURIComponent(fort?.name + " fort maharashtra")}`;
                        window.open(url, "_blank");
                      }
                    }}
                  >
                    <NavigationIcon className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>

                  <Link to={`/trek-groups?fortName=${encodeURIComponent(fort.name)}&backToFortId=${fort.id}&backToFortName=${encodeURIComponent(fort.name)}`}>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Find Trek Groups
                    </Button>
                  </Link>

                  <Link to="/contribute?tab=book-trek">
                    <Button
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Trek Enquiry
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <GuideContacts fortName={fort.name} limit={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
