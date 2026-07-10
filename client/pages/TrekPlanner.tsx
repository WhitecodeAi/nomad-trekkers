import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiService, fortHelpers, Fort } from "@/lib/api";
import {
  trekPlanAPI,
  trekPlanHelpers,
  PDFGenerator,
  TrekPlan,
  TrekPlanSummary,
  GearItem,
  CreateTrekPlanRequest,
  TrekPlanPDFData,
} from "@/lib/trek-plan-api";
import {
  GROUP_SIZE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  TREK_PREFERENCES_OPTIONS,
} from "@shared/trek-plan-api";
import {
  rideBookingAPI,
  rideBookingHelpers,
  FortTransportRoute,
  EnrichedVehicle,
  EnrichedRideBooking,
  CreateRideBookingRequest,
} from "@/lib/ride-booking-api";
import { PICKUP_TIME_SLOTS } from "@shared/ride-booking-api";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Backpack,
  Mountain,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  CloudRain,
  Sun,
  Thermometer,
  Star,
  Search,
  Save,
  Share2,
  Download,
  Loader2,
  Edit,
  Trash2,
  Copy,
  FileText,
  RefreshCw,
  Car,
  IndianRupee,
  Phone,
  Mail,
  User,
  Timer,
  Route,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PlannerState {
  selectedForts: number[];
  trekDate: Date | undefined;
  groupSize: string;
  experience: string;
  preferences: string[];
  notes: string;
  name: string;
  description: string;
}

interface WeatherForecast {
  date: string;
  temp: string;
  condition: string;
  icon: React.ReactNode;
  rainfall: string;
}

export default function TrekPlanner() {
  const [forts, setForts] = useState<Fort[]>([]);
  const [fortSearchQuery, setFortSearchQuery] = useState("");
  const [savedPlans, setSavedPlans] = useState<TrekPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<TrekPlan | null>(null);
  const [activeTab, setActiveTab] = useState("planner");

  // Ride booking state
  const [transportRoutes, setTransportRoutes] = useState<FortTransportRoute[]>(
    [],
  );
  const [availableVehicles, setAvailableVehicles] = useState<EnrichedVehicle[]>(
    [],
  );
  const [userRideBookings, setUserRideBookings] = useState<
    EnrichedRideBooking[]
  >([]);
  const [rideLoading, setRideLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<FortTransportRoute | null>(
    null,
  );
  const [rideBookingForm, setRideBookingForm] = useState({
    customerInfo: {
      name: "",
      phone: "",
      email: "",
    },
    selectedVehicle: "",
    pickupPoint: "",
    bookingDate: "",
    pickupTime: "",
    numberOfPeople: 1,
    specialRequests: "",
  });

  const [plannerState, setPlannerState] = useState<PlannerState>({
    selectedForts: [],
    trekDate: undefined,
    groupSize: "",
    experience: "",
    preferences: [],
    notes: "",
    name: "",
    description: "",
  });

  const defaultGearChecklist: GearItem[] = [
    {
      id: "gear-1",
      item: "Trekking shoes",
      essential: true,
      checked: false,
      category: "equipment",
    },
    {
      id: "gear-2",
      item: "Water bottles (3-4L)",
      essential: true,
      checked: false,
      category: "equipment",
    },
    {
      id: "gear-3",
      item: "First aid kit",
      essential: true,
      checked: false,
      category: "safety",
    },
    {
      id: "gear-4",
      item: "Headlamp/Flashlight",
      essential: true,
      checked: false,
      category: "equipment",
    },
    {
      id: "gear-5",
      item: "Energy bars/Snacks",
      essential: true,
      checked: false,
      category: "food",
    },
    {
      id: "gear-6",
      item: "Emergency whistle",
      essential: true,
      checked: false,
      category: "safety",
    },
    {
      id: "gear-7",
      item: "Rain gear",
      essential: false,
      checked: false,
      category: "clothing",
    },
    {
      id: "gear-8",
      item: "Trekking poles",
      essential: false,
      checked: false,
      category: "equipment",
    },
    {
      id: "gear-9",
      item: "Portable charger",
      essential: false,
      checked: false,
      category: "equipment",
    },
    {
      id: "gear-10",
      item: "Camera",
      essential: false,
      checked: false,
      category: "equipment",
    },
  ];

  const [gearChecklist, setGearChecklist] =
    useState<GearItem[]>(defaultGearChecklist);

  const weatherForecast: WeatherForecast[] = [
    {
      date: "Today",
      temp: "18°C - 28°C",
      condition: "Sunny",
      icon: <Sun className="h-5 w-5 text-yellow-500" />,
      rainfall: "0%",
    },
    {
      date: "Tomorrow",
      temp: "16°C - 26°C",
      condition: "Partly Cloudy",
      icon: <Sun className="h-5 w-5 text-yellow-400" />,
      rainfall: "10%",
    },
    {
      date: "Day 3",
      temp: "15°C - 24°C",
      condition: "Cloudy",
      icon: <CloudRain className="h-5 w-5 text-gray-500" />,
      rainfall: "30%",
    },
    {
      date: "Day 4",
      temp: "14°C - 22°C",
      condition: "Rainy",
      icon: <CloudRain className="h-5 w-5 text-blue-500" />,
      rainfall: "80%",
    },
    {
      date: "Day 5",
      temp: "17°C - 27°C",
      condition: "Clear",
      icon: <Sun className="h-5 w-5 text-yellow-500" />,
      rainfall: "5%",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fortsResponse, plansResponse, routesResponse] =
          await Promise.all([
            apiService.getForts({ sortBy: "name" }),
            trekPlanAPI.getTrekPlans({ sortBy: "updatedAt" }),
            rideBookingAPI.getTransportRoutes(),
          ]);

        setForts(fortsResponse.data);
        setSavedPlans(plansResponse.data);
        setTransportRoutes(routesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load user ride bookings
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const response = await rideBookingAPI.getUserRideBookings({
          limit: 10,
        });
        setUserRideBookings(response.data);
      } catch (err) {
        console.error("Error fetching user bookings:", err);
      }
    };

    fetchUserBookings();
  }, []);

  const toggleFortSelection = (fortId: number) => {
    setPlannerState((prev) => ({
      ...prev,
      selectedForts: prev.selectedForts.includes(fortId)
        ? prev.selectedForts.filter((id) => id !== fortId)
        : [...prev.selectedForts, fortId],
    }));
  };

  const togglePreference = (preference: string) => {
    setPlannerState((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter((p) => p !== preference)
        : [...prev.preferences, preference],
    }));
  };

  const toggleGearItem = (index: number) => {
    setGearChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const saveTrekPlan = async () => {
    if (!plannerState.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your trek plan.",
        variant: "destructive",
      });
      return;
    }

    if (plannerState.selectedForts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one fort for your trek.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const planData: CreateTrekPlanRequest = {
        name: plannerState.name.trim(),
        description: plannerState.description.trim() || undefined,
        selectedForts: plannerState.selectedForts,
        trekDate: plannerState.trekDate?.toISOString(),
        groupSize: plannerState.groupSize,
        experience: plannerState.experience,
        preferences: plannerState.preferences,
        notes: plannerState.notes,
        gearChecklist: gearChecklist,
      };

      let response;
      if (editingPlan) {
        response = await trekPlanAPI.updateTrekPlan(editingPlan.id, planData);
        toast({
          title: "Success",
          description: "Trek plan updated successfully!",
        });
      } else {
        response = await trekPlanAPI.createTrekPlan(planData);
        toast({
          title: "Success",
          description: "Trek plan saved successfully!",
        });
      }

      // Refresh saved plans
      const plansResponse = await trekPlanAPI.getTrekPlans({
        sortBy: "updatedAt",
      });
      setSavedPlans(plansResponse.data);

      // Reset form if creating new plan
      if (!editingPlan) {
        resetForm();
      }
      setEditingPlan(null);

      // Stay on planner tab after saving
      setActiveTab("planner");
    } catch (err) {
      console.error("Error saving trek plan:", err);
      toast({
        title: "Error",
        description: "Failed to save trek plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadTrekPlan = async (planId: string) => {
    try {
      setLoading(true);
      const response = await trekPlanAPI.getTrekPlanById(planId);
      const plan = response.data;

      setPlannerState({
        selectedForts: plan.selectedForts,
        trekDate: plan.trekDate ? new Date(plan.trekDate) : undefined,
        groupSize: plan.groupSize,
        experience: plan.experience,
        preferences: plan.preferences,
        notes: plan.notes,
        name: plan.name,
        description: plan.description || "",
      });

      setGearChecklist(plan.gearChecklist);
      setEditingPlan(plan);

      // Switch to planner tab for editing
      setActiveTab("planner");

      toast({
        title: "Success",
        description: "Trek plan loaded successfully!",
      });
    } catch (err) {
      console.error("Error loading trek plan:", err);
      toast({
        title: "Error",
        description: "Failed to load trek plan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrekPlan = async (planId: string) => {
    try {
      await trekPlanAPI.deleteTrekPlan(planId);

      // Refresh saved plans
      const plansResponse = await trekPlanAPI.getTrekPlans({
        sortBy: "updatedAt",
      });
      setSavedPlans(plansResponse.data);

      toast({
        title: "Success",
        description: "Trek plan deleted successfully!",
      });
    } catch (err) {
      console.error("Error deleting trek plan:", err);
      toast({
        title: "Error",
        description: "Failed to delete trek plan.",
        variant: "destructive",
      });
    }
  };

  const duplicateTrekPlan = async (planId: string) => {
    try {
      await trekPlanAPI.duplicateTrekPlan(planId);

      // Refresh saved plans
      const plansResponse = await trekPlanAPI.getTrekPlans({
        sortBy: "updatedAt",
      });
      setSavedPlans(plansResponse.data);

      toast({
        title: "Success",
        description: "Trek plan duplicated successfully!",
      });
    } catch (err) {
      console.error("Error duplicating trek plan:", err);
      toast({
        title: "Error",
        description: "Failed to duplicate trek plan.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async (planId?: string) => {
    try {
      setExporting(true);

      let targetPlanId = planId;

      // If no planId provided, we need to save the current plan first
      if (!targetPlanId && !editingPlan) {
        if (
          !plannerState.name.trim() ||
          plannerState.selectedForts.length === 0
        ) {
          toast({
            title: "Error",
            description:
              "Please save your trek plan first before exporting to PDF.",
            variant: "destructive",
          });
          return;
        }

        // Save the plan first
        const planData: CreateTrekPlanRequest = {
          name: plannerState.name.trim(),
          description: plannerState.description.trim() || undefined,
          selectedForts: plannerState.selectedForts,
          trekDate: plannerState.trekDate?.toISOString(),
          groupSize: plannerState.groupSize,
          experience: plannerState.experience,
          preferences: plannerState.preferences,
          notes: plannerState.notes.trim(),
          gearChecklist: gearChecklist,
        };

        const response = await trekPlanAPI.createTrekPlan(planData);
        targetPlanId = response.data.id;
      } else if (editingPlan) {
        targetPlanId = editingPlan.id;
      }

      if (!targetPlanId) {
        throw new Error("No plan ID available for export");
      }

      // Get PDF data from backend
      const pdfResponse = await trekPlanAPI.getTrekPlanPDFData(targetPlanId);
      const pdfData = pdfResponse.data;

      // Generate and download PDF
      const filename = `${plannerState.name.replace(/[^a-zA-Z0-9]/g, "_")}_Trek_Plan.pdf`;
      await PDFGenerator.generateTrekPlanPDF(pdfData, filename);

      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (err) {
      console.error("Error exporting to PDF:", err);

      // Provide specific error messages based on the type of error
      let errorMessage = "Failed to export to PDF. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("PDF library failed to load")) {
          errorMessage =
            "PDF library failed to load. Please refresh the page and try again.";
        } else if (err.message.includes("Trek plan data is incomplete")) {
          errorMessage =
            "Please ensure your trek plan has a name and at least one selected fort.";
        } else if (err.message.includes("No plan ID available")) {
          errorMessage =
            "Unable to save trek plan. Please check your internet connection and try again.";
        } else if (
          err.message.includes("jspdf") ||
          err.message.includes("module")
        ) {
          errorMessage =
            "PDF generation library error. Please refresh the page and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      toast({
        title: "PDF Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const shareplan = async (planId: string) => {
    try {
      const response = await trekPlanAPI.getShareableURL(planId);
      const shareUrl = response.data.shareUrl;

      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Success",
        description: "Share link copied to clipboard!",
      });
    } catch (err) {
      console.error("Error sharing plan:", err);
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPlannerState({
      selectedForts: [],
      trekDate: undefined,
      groupSize: "",
      experience: "",
      preferences: [],
      notes: "",
      name: "",
      description: "",
    });
    setGearChecklist(defaultGearChecklist);
    setEditingPlan(null);

    // Switch back to planner tab when creating new plan
    setActiveTab("planner");
  };

  const getCompletionStats = () => {
    return trekPlanHelpers.calculateGearCompletion(gearChecklist);
  };

  const stats = getCompletionStats();

  // Ride booking helper functions
  const handleFortSelectionForRide = async (fortId: number) => {
    try {
      setRideLoading(true);

      // Get transport routes for this fort
      const routesResponse = await rideBookingAPI.getTransportRoutes(fortId);
      const routes = routesResponse.data.filter(
        (route) => route.fortId === fortId,
      );

      if (routes.length > 0) {
        setSelectedRoute(routes[0]); // Select first available route

        // Get available vehicles
        const vehiclesResponse = await rideBookingAPI.getAvailableVehicles({
          fortId: fortId,
          numberOfPeople: rideBookingForm.numberOfPeople,
        });

        setAvailableVehicles(vehiclesResponse.data);
      } else {
        toast({
          title: "No Routes Available",
          description: "Transportation is not available for this fort yet.",
          variant: "destructive",
        });
        setSelectedRoute(null);
        setAvailableVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching transport data:", err);
      toast({
        title: "Error",
        description: "Failed to load transportation options.",
        variant: "destructive",
      });
    } finally {
      setRideLoading(false);
    }
  };

  const handleRideBooking = async () => {
    try {
      // Validation
      if (!rideBookingForm.customerInfo.name.trim()) {
        toast({
          title: "Error",
          description: "Please enter your full name.",
          variant: "destructive",
        });
        return;
      }

      if (!rideBookingForm.customerInfo.phone.trim()) {
        toast({
          title: "Error",
          description: "Please enter your phone number.",
          variant: "destructive",
        });
        return;
      }

      if (
        !rideBookingHelpers.isValidPhoneNumber(
          rideBookingForm.customerInfo.phone,
        )
      ) {
        toast({
          title: "Error",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        });
        return;
      }

      if (
        !rideBookingForm.pickupPoint ||
        !rideBookingForm.bookingDate ||
        !rideBookingForm.pickupTime
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required booking details.",
          variant: "destructive",
        });
        return;
      }

      if (
        !rideBookingHelpers.validateBookingTime(
          rideBookingForm.bookingDate,
          rideBookingForm.pickupTime,
        )
      ) {
        toast({
          title: "Error",
          description: "Booking must be made at least 2 hours in advance.",
          variant: "destructive",
        });
        return;
      }

      if (!selectedRoute) {
        toast({
          title: "Error",
          description: "Please select a route first.",
          variant: "destructive",
        });
        return;
      }

      setRideLoading(true);

      const bookingData: CreateRideBookingRequest = {
        customerInfo: {
          name: rideBookingForm.customerInfo.name.trim(),
          phone: rideBookingForm.customerInfo.phone.trim(),
          email: rideBookingForm.customerInfo.email.trim() || undefined,
        },
        fortId: selectedRoute.fortId,
        routeId: selectedRoute.id,
        vehicleId: rideBookingForm.selectedVehicle,
        pickupPointId: rideBookingForm.pickupPoint,
        bookingDate: rideBookingForm.bookingDate,
        pickupTime: rideBookingForm.pickupTime,
        numberOfPeople: rideBookingForm.numberOfPeople,
        specialRequests: rideBookingForm.specialRequests.trim() || undefined,
      };

      const response = await rideBookingAPI.createRideBooking(bookingData);

      toast({
        title: "Success",
        description:
          "Ride booked successfully! The driver will contact you shortly.",
      });

      // Reset form
      setRideBookingForm({
        customerInfo: { name: "", phone: "", email: "" },
        selectedVehicle: "",
        pickupPoint: "",
        bookingDate: "",
        pickupTime: "",
        numberOfPeople: 1,
        specialRequests: "",
      });
      setSelectedRoute(null);
      setAvailableVehicles([]);

      // Refresh user bookings
      if (rideBookingForm.customerInfo.phone) {
        const bookingsResponse = await rideBookingAPI.getUserRideBookings({
          phone: rideBookingForm.customerInfo.phone,
        });
        setUserRideBookings(bookingsResponse.data);
      }
    } catch (err) {
      console.error("Error creating ride booking:", err);
      toast({
        title: "Error",
        description: "Failed to create ride booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRideLoading(false);
    }
  };

  const filteredForts = forts.filter((fort) => {
    const query = fortSearchQuery.toLowerCase();
    return (
      fort.name.toLowerCase().includes(query) ||
      fort.location.toLowerCase().includes(query) ||
      fort.difficulty.toLowerCase().includes(query)
    );
  });

  if (loading && forts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading trek planner...</p>
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
                Trek Planner
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Plan your perfect fort trekking adventure. Save your plans,
                generate PDFs, and share with fellow trekkers.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="planner">Plan Trek</TabsTrigger>
              <TabsTrigger value="gear">Gear Checklist</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="saved">
                Saved Plans ({savedPlans.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planner" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Planning Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Plan Name and Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Details</CardTitle>
                      <CardDescription>
                        Give your trek plan a name and description
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Plan Name *
                        </label>
                        <Input
                          placeholder="e.g., Weekend Warrior Trek"
                          value={plannerState.name}
                          onChange={(e) =>
                            setPlannerState((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Description
                        </label>
                        <Textarea
                          placeholder="Brief description of your trek plan..."
                          value={plannerState.description}
                          onChange={(e) =>
                            setPlannerState((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Select Forts</CardTitle>
                      <CardDescription>
                        Choose one or more forts for your trekking adventure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search forts by name, location, or difficulty..."
                          value={fortSearchQuery}
                          onChange={(e) => setFortSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {error ? (
                        <div className="text-center text-muted-foreground">
                          <p>{error}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {filteredForts.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                              No forts match your search.
                            </div>
                          ) : (
                            filteredForts.map((fort) => (
                              <div
                                key={fort.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                  plannerState.selectedForts.includes(fort.id)
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => toggleFortSelection(fort.id)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{fort.name}</h4>
                                  {plannerState.selectedForts.includes(
                                    fort.id,
                                  ) && (
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    className={fortHelpers.getDifficultyColor(
                                      fort.difficulty,
                                    )}
                                    variant="secondary"
                                  >
                                    {fort.difficulty}
                                  </Badge>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                    {fortHelpers.formatRating(fort.rating)}
                                  </div>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground mb-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {fort.duration}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {fort.location}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Trek Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Trek Date
                          </label>
                          <Calendar
                            mode="single"
                            selected={plannerState.trekDate}
                            onSelect={(date) =>
                              setPlannerState((prev) => ({
                                ...prev,
                                trekDate: date,
                              }))
                            }
                            className="rounded-md border w-full"
                            disabled={(date) => date < new Date()}
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Group Size
                            </label>
                            <Select
                              value={plannerState.groupSize}
                              onValueChange={(value) =>
                                setPlannerState((prev) => ({
                                  ...prev,
                                  groupSize: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select group size" />
                              </SelectTrigger>
                              <SelectContent>
                                {GROUP_SIZE_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Experience Level
                            </label>
                            <Select
                              value={plannerState.experience}
                              onValueChange={(value) =>
                                setPlannerState((prev) => ({
                                  ...prev,
                                  experience: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select experience level" />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Trek Preferences
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {TREK_PREFERENCES_OPTIONS.map((preference) => (
                            <div
                              key={preference}
                              className={`p-2 text-sm border rounded cursor-pointer transition-all ${
                                plannerState.preferences.includes(preference)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => togglePreference(preference)}
                            >
                              {preference}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Additional Notes
                        </label>
                        <Textarea
                          placeholder="Any special requirements, dietary restrictions, or other notes..."
                          value={plannerState.notes}
                          onChange={(e) =>
                            setPlannerState((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trek Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Plan Name</h5>
                          <p className="text-sm text-muted-foreground">
                            {plannerState.name || "Untitled Trek Plan"}
                          </p>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">
                            Selected Forts ({plannerState.selectedForts.length})
                          </h5>
                          {plannerState.selectedForts.length > 0 ? (
                            <div className="space-y-2">
                              {plannerState.selectedForts.map((fortId) => {
                                const fort = forts.find((f) => f.id === fortId);
                                return fort ? (
                                  <div
                                    key={fortId}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span>{fort.name}</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {fort.difficulty}
                                    </Badge>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No forts selected
                            </p>
                          )}
                        </div>

                        {plannerState.trekDate && (
                          <div>
                            <h5 className="font-medium mb-1">Trek Date</h5>
                            <p className="text-sm text-muted-foreground">
                              {plannerState.trekDate.toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {plannerState.groupSize && (
                          <div>
                            <h5 className="font-medium mb-1">Group Size</h5>
                            <p className="text-sm text-muted-foreground">
                              {trekPlanHelpers.formatGroupSize(
                                plannerState.groupSize,
                              )}
                            </p>
                          </div>
                        )}

                        {plannerState.preferences.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Preferences</h5>
                            <div className="flex flex-wrap gap-1">
                              {plannerState.preferences.map((pref) => (
                                <Badge
                                  key={pref}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {pref}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={saveTrekPlan}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {editingPlan ? "Update Plan" : "Save Plan"}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => exportToPDF()}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export PDF
                      </Button>

                      {editingPlan && (
                        <>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => shareplan(editingPlan.id)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Plan
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={resetForm}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            New Plan
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gear" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gear Checklist</CardTitle>
                      <CardDescription>
                        Essential and recommended items for your trek
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                            Essential Items
                          </h4>
                          <div className="space-y-2">
                            {gearChecklist
                              .filter((item) => item.essential)
                              .map((item, index) => (
                                <div
                                  key={item.id}
                                  className="flex items-center space-x-3"
                                >
                                  <Checkbox
                                    checked={item.checked}
                                    onCheckedChange={() =>
                                      toggleGearItem(
                                        gearChecklist.indexOf(item),
                                      )
                                    }
                                  />
                                  <span
                                    className={`${item.checked ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {item.item}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-xs ml-auto"
                                  >
                                    {item.category}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Plus className="h-4 w-4 mr-2 text-blue-500" />
                            Optional Items
                          </h4>
                          <div className="space-y-2">
                            {gearChecklist
                              .filter((item) => !item.essential)
                              .map((item, index) => (
                                <div
                                  key={item.id}
                                  className="flex items-center space-x-3"
                                >
                                  <Checkbox
                                    checked={item.checked}
                                    onCheckedChange={() =>
                                      toggleGearItem(
                                        gearChecklist.indexOf(item),
                                      )
                                    }
                                  />
                                  <span
                                    className={`${item.checked ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {item.item}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-xs ml-auto"
                                  >
                                    {item.category}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Preparation Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Essential Items</span>
                          <span>
                            {stats.essentialChecked}/{stats.essential}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.essentialCompletion}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Optional Items</span>
                          <span>
                            {stats.checked - stats.essentialChecked}/
                            {stats.total - stats.essential}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                stats.total - stats.essential > 0
                                  ? Math.round(
                                      ((stats.checked -
                                        stats.essentialChecked) /
                                        (stats.total - stats.essential)) *
                                        100,
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {stats.essentialCompletion === 100 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center text-green-700 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">
                              All essentials packed!
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weather" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>5-Day Weather Forecast</CardTitle>
                  <CardDescription>
                    Plan your trek based on weather conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {weatherForecast.map((day, index) => (
                      <div
                        key={index}
                        className="text-center p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="font-medium mb-2">{day.date}</div>
                        <div className="flex justify-center mb-2">
                          {day.icon}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {day.condition}
                        </div>
                        <div className="text-sm font-medium mb-1">
                          {day.temp}
                        </div>
                        <div className="text-xs text-blue-600">
                          Rain: {day.rainfall}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weather Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Sun className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>
                          Clear days are perfect for photography and panoramic
                          views
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CloudRain className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>
                          Rainy conditions make trails slippery - bring proper
                          footwear
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500 mt-0.5" />
                        <span>
                          Check temperature variations and dress in layers
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Trek Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Temperature</span>
                        <span className="text-green-600">15°C - 25°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Rainfall</span>
                        <span className="text-green-600">Less than 20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Visibility</span>
                        <span className="text-green-600">Clear skies</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Wind</span>
                        <span className="text-green-600">Light breeze</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rides" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Book Transportation</CardTitle>
                  <CardDescription>
                    Book rides with local drivers for convenient transportation
                    to your selected forts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">
                        Functionality Disabled
                      </h3>
                      <p className="max-w-md mx-auto">
                        Ride booking functionality is currently disabled. Please arrange your own transportation or check back later.
                      </p>
                    </div>
                  ) : plannerState.selectedForts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Select a Fort First
                      </h3>
                      <p>
                        Please select at least one fort in the "Plan Trek" tab
                        to view available transportation options.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Fort Selection for Rides */}
                      <div>
                        <h4 className="font-semibold mb-3">
                          Select Fort for Transportation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {plannerState.selectedForts.map((fortId) => {
                            const fort = forts.find((f) => f.id === fortId);
                            if (!fort) return null;

                            return (
                              <div
                                key={fortId}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedRoute?.fortId === fortId
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() =>
                                  handleFortSelectionForRide(fortId)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium">{fort.name}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {fort.location}
                                    </p>
                                  </div>
                                  {selectedRoute?.fortId === fortId && (
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Available Vehicles */}
                      {selectedRoute && (
                        <div>
                          <h4 className="font-semibold mb-3">
                            Available Vehicles
                          </h4>
                          {rideLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : availableVehicles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Car className="h-8 w-8 mx-auto mb-2" />
                              <p>No vehicles available for this route</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {availableVehicles.map((vehicle) => (
                                <Card
                                  key={vehicle.id}
                                  className={`cursor-pointer transition-all ${
                                    rideBookingForm.selectedVehicle ===
                                    vehicle.id
                                      ? "border-primary ring-1 ring-primary"
                                      : "hover:shadow-md"
                                  }`}
                                  onClick={() =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      selectedVehicle: vehicle.id,
                                    }))
                                  }
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h5 className="font-semibold text-lg">
                                          {vehicle.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {rideBookingHelpers.getVehicleTypeIcon(
                                              vehicle.type,
                                            )}{" "}
                                            {vehicle.type.toUpperCase()}
                                          </Badge>
                                          <span className="text-sm text-muted-foreground">
                                            Up to {vehicle.capacity} people
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xl font-bold text-primary">
                                          {rideBookingHelpers.formatPrice(
                                            vehicle.calculatedPrice,
                                          )}
                                        </div>
                                        {vehicle.priceBreakdown.discount >
                                          0 && (
                                          <div className="text-xs text-green-600">
                                            {vehicle.priceBreakdown.discount}%
                                            group discount
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Driver Info */}
                                    {vehicle.driver && (
                                      <div className="flex items-center gap-3 mb-3 p-2 bg-muted/30 rounded">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-500 rounded-full" />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">
                                            {vehicle.driver.name}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Star className="h-3 w-3 text-yellow-500" />
                                            {vehicle.driver.rating} (
                                            {vehicle.driver.totalTrips} trips)
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {vehicle.driver.experienceYears}+
                                          years
                                        </div>
                                      </div>
                                    )}

                                    {/* Vehicle Features */}
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {vehicle.features
                                          .slice(0, 3)
                                          .map((feature, index) => (
                                            <Badge
                                              key={index}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {feature}
                                            </Badge>
                                          ))}
                                        {vehicle.features.length > 3 && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            +{vehicle.features.length - 3} more
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Price Breakdown */}
                                      <div className="text-xs text-muted-foreground">
                                        Base:{" "}
                                        {rideBookingHelpers.formatPrice(
                                          vehicle.priceBreakdown.basePrice,
                                        )}{" "}
                                        + Distance:{" "}
                                        {rideBookingHelpers.formatPrice(
                                          vehicle.priceBreakdown.distanceCharge,
                                        )}
                                        ({vehicle.priceBreakdown.distance}km)
                                      </div>
                                    </div>

                                    {rideBookingForm.selectedVehicle ===
                                      vehicle.id && (
                                      <div className="mt-3 pt-3 border-t">
                                        <CheckCircle className="h-4 w-4 text-primary inline mr-2" />
                                        <span className="text-sm font-medium text-primary">
                                          Selected
                                        </span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking Form */}
                      {rideBookingForm.selectedVehicle && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Complete Your Booking</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Customer Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Full Name *
                                </label>
                                <Input
                                  placeholder="Enter your full name"
                                  value={rideBookingForm.customerInfo.name}
                                  onChange={(e) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      customerInfo: {
                                        ...prev.customerInfo,
                                        name: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Phone Number *
                                </label>
                                <Input
                                  placeholder="+91 XXXXX XXXXX"
                                  value={rideBookingForm.customerInfo.phone}
                                  onChange={(e) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      customerInfo: {
                                        ...prev.customerInfo,
                                        phone: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Email (Optional)
                              </label>
                              <Input
                                type="email"
                                placeholder="your.email@example.com"
                                value={rideBookingForm.customerInfo.email}
                                onChange={(e) =>
                                  setRideBookingForm((prev) => ({
                                    ...prev,
                                    customerInfo: {
                                      ...prev.customerInfo,
                                      email: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>

                            {/* Pickup Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Pickup Point *
                                </label>
                                <Select
                                  value={rideBookingForm.pickupPoint}
                                  onValueChange={(value) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      pickupPoint: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select pickup point" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedRoute?.pickupPoints.map(
                                      (point) => (
                                        <SelectItem
                                          key={point.id}
                                          value={point.id}
                                        >
                                          <div>
                                            <div className="font-medium">
                                              {point.name}
                                            </div>
                                            {point.landmark && (
                                              <div className="text-xs text-muted-foreground">
                                                {point.landmark}
                                              </div>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Date *
                                </label>
                                <Input
                                  type="date"
                                  value={rideBookingForm.bookingDate}
                                  min={new Date().toISOString().split("T")[0]}
                                  onChange={(e) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      bookingDate: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Pickup Time *
                                </label>
                                <Select
                                  value={rideBookingForm.pickupTime}
                                  onValueChange={(value) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      pickupTime: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PICKUP_TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Number of People *
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={
                                    availableVehicles.find(
                                      (v) =>
                                        v.id ===
                                        rideBookingForm.selectedVehicle,
                                    )?.capacity || 10
                                  }
                                  value={rideBookingForm.numberOfPeople}
                                  onChange={(e) =>
                                    setRideBookingForm((prev) => ({
                                      ...prev,
                                      numberOfPeople:
                                        parseInt(e.target.value) || 1,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Special Requests (Optional)
                              </label>
                              <Textarea
                                placeholder="Any special requirements or instructions..."
                                value={rideBookingForm.specialRequests}
                                onChange={(e) =>
                                  setRideBookingForm((prev) => ({
                                    ...prev,
                                    specialRequests: e.target.value,
                                  }))
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={handleRideBooking}
                                disabled={rideLoading}
                                className="flex-1"
                              >
                                {rideLoading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Car className="h-4 w-4 mr-2" />
                                )}
                                Book Ride
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRideBookingForm({
                                    customerInfo: {
                                      name: "",
                                      phone: "",
                                      email: "",
                                    },
                                    selectedVehicle: "",
                                    pickupPoint: "",
                                    bookingDate: "",
                                    pickupTime: "",
                                    numberOfPeople: 1,
                                    specialRequests: "",
                                  });
                                  setSelectedRoute(null);
                                }}
                              >
                                Reset
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* User's Previous Bookings */}
                      {userRideBookings.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Your Ride Bookings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {userRideBookings.slice(0, 3).map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {booking.route?.fortName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {rideBookingHelpers.formatDateTime(
                                        booking.bookingDate,
                                        booking.pickupTime,
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge
                                      className={rideBookingHelpers.getBookingStatusColor(
                                        booking.bookingStatus,
                                      )}
                                    >
                                      {booking.bookingStatus}
                                    </Badge>
                                    <div className="text-sm font-medium">
                                      {rideBookingHelpers.formatPrice(
                                        booking.totalPrice,
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Saved Trek Plans</CardTitle>
                      <CardDescription>
                        Your previously saved trekking plans and itineraries
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        trekPlanAPI
                          .getTrekPlans({ sortBy: "updatedAt" })
                          .then((response) => setSavedPlans(response.data));
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedPlans.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Mountain className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No saved plans yet
                      </h3>
                      <p>Start planning your first trek to save it here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedPlans.map((plan) => (
                        <Card
                          key={plan.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold mb-1">
                                  {plan.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {plan.selectedFortsCount} fort
                                  {plan.selectedFortsCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <Badge
                                className={trekPlanHelpers.getDifficultyColor(
                                  plan.difficulty,
                                )}
                                variant="secondary"
                              >
                                {plan.difficulty}
                              </Badge>
                            </div>

                            {plan.trekDate && (
                              <div className="flex items-center text-sm text-muted-foreground mb-3">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(plan.trekDate).toLocaleDateString()}
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground mb-4">
                              Created:{" "}
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadTrekPlan(plan.id)}
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Plan Actions</DialogTitle>
                                    <DialogDescription>
                                      Choose an action for "{plan.name}"
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => exportToPDF(plan.id)}
                                      disabled={exporting}
                                    >
                                      {exporting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                      )}
                                      Export PDF
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => shareplan(plan.id)}
                                    >
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => duplicateTrekPlan(plan.id)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteTrekPlan(plan.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
