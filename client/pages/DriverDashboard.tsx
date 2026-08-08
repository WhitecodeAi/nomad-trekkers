import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  rideBookingAPI, 
  rideBookingHelpers,
  EnrichedRideBooking
} from "@/lib/ride-booking-api";
import {
  Bell,
  Car,
  Users,
  Calendar,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  MapPin,
  Star,
  AlertTriangle,
  Eye,
  Navigation as NavigationIcon,
  DollarSign,
  Award,
  Route
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  totalTrips: number;
  experienceYears: number;
  languages: string[];
  profileImage?: string;
}

interface DriverNotification {
  id: string;
  driverId: string;
  bookingId: string;
  type: 'new_booking' | 'booking_cancelled' | 'payment_received';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function DriverDashboard() {
  // Auto-login with default driver - no login required
  const selectedDriverId = "driver-1";
  const [driver, setDriver] = useState<Driver | null>({
    id: "driver-1",
    name: "Ravi Patil",
    phone: "+91 9876543210",
    rating: 4.8,
    totalTrips: 245,
    experienceYears: 8,
    languages: ["Marathi", "Hindi", "English"],
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  });
  const [bookings, setBookings] = useState<EnrichedRideBooking[]>([]);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    date: ''
  });

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      // Fetch driver bookings
      const response = await fetch(`/api/ride-bookings/driver/${selectedDriverId}`);
      const bookingsData = await response.json();

      // Fetch driver notifications
      const notifResponse = await fetch(`/api/ride-bookings/driver/${selectedDriverId}/notifications`);
      const notifData = await notifResponse.json();

      if (bookingsData.success) {
        setBookings(bookingsData.data);
      }

      if (notifData.success) {
        setNotifications(notifData.data);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch(`/api/ride-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          driverId: selectedDriverId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Booking ${action} successfully`
        });
        fetchDriverData(); // Refresh data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive"
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/ride-bookings/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      fetchDriverData(); // Refresh data
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchDriverData();
      toast({
        title: "Success",
        description: "Data refreshed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.bookingStatus !== filters.status) {
      return false;
    }
    
    if (filters.date && booking.bookingDate !== filters.date) {
      return false;
    }
    
    return true;
  });

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending');
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed');
  const totalEarnings = bookings
    .filter(b => b.bookingStatus === 'completed' && b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading driver dashboard...</p>
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
        <div className="bg-muted/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={driver?.profileImage} alt={driver?.name} />
                  <AvatarFallback>
                    {driver?.name?.split(' ').map(n => n[0]).join('') || 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Welcome, {driver?.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center text-muted-foreground">
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                      <span>{driver?.rating}/5 Rating</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Route className="h-4 w-4 mr-1" />
                      <span>{driver?.totalTrips} Trips</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Award className="h-4 w-4 mr-1" />
                      <span>{driver?.experienceYears} Years</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {unreadNotifications.length} New
                  </Badge>
                )}
                <Button 
                  onClick={refreshData} 
                  disabled={refreshing}
                  variant="outline"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confirmed Trips</p>
                    <p className="text-2xl font-bold text-green-600">{confirmedBookings.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">{rideBookingHelpers.formatPrice(totalEarnings)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                    <p className="text-2xl font-bold text-blue-600">{unreadNotifications.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bookings">
                My Bookings
                {pendingBookings.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingBookings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Ride Bookings</CardTitle>
                      <CardDescription>
                        Manage your upcoming and past ride bookings
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {filteredBookings.length} bookings
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex gap-4 mb-6">
                    <Select 
                      value={filters.status} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={filters.date}
                      onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                      className="w-40"
                    />
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-4">
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="h-8 w-8 mx-auto mb-2" />
                        <p>No bookings found</p>
                      </div>
                    ) : (
                      filteredBookings.map(booking => (
                        <Card key={booking.id} className={`border-l-4 ${
                          booking.bookingStatus === 'pending' ? 'border-l-yellow-500' :
                          booking.bookingStatus === 'confirmed' ? 'border-l-green-500' :
                          booking.bookingStatus === 'rejected' ? 'border-l-red-500' :
                          'border-l-blue-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Trip Info */}
                              <div>
                                <h4 className="font-semibold text-lg mb-2">{booking.route?.fortName}</h4>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {rideBookingHelpers.formatDateTime(booking.bookingDate, booking.pickupTime)}
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="h-3 w-3 mr-1" />
                                    {booking.numberOfPeople} people
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {booking.pickupPoint?.name}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Customer Details</h4>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Users className="h-3 w-3 mr-1" />
                                    {booking.customerInfo.name}
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {booking.customerInfo.phone}
                                  </div>
                                  {booking.customerInfo.email && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {booking.customerInfo.email}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status & Actions */}
                              <div>
                                <div className="flex flex-col gap-2 mb-3">
                                  <Badge className={rideBookingHelpers.getBookingStatusColor(booking.bookingStatus)}>
                                    {booking.bookingStatus}
                                  </Badge>
                                  <div className="text-lg font-bold">
                                    {rideBookingHelpers.formatPrice(booking.totalPrice)}
                                  </div>
                                </div>
                                
                                {booking.bookingStatus === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleBookingAction(booking.id, 'rejected')}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Special Requests */}
                            {booking.specialRequests && (
                              <div className="mt-3 pt-3 border-t">
                                <h5 className="font-medium text-sm mb-1">Special Requests</h5>
                                <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Stay updated with new booking requests and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <Card 
                          key={notification.id} 
                          className={`cursor-pointer transition-colors ${
                            notification.isRead ? 'bg-muted/20' : 'bg-blue-50 border-l-4 border-l-blue-500'
                          }`}
                          onClick={() => !notification.isRead && markNotificationRead(notification.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                notification.type === 'new_booking' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'booking_cancelled' ? 'bg-red-100 text-red-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {notification.type === 'new_booking' && <Bell className="h-4 w-4" />}
                                {notification.type === 'booking_cancelled' && <XCircle className="h-4 w-4" />}
                                {notification.type === 'payment_received' && <DollarSign className="h-4 w-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(notification.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Profile</CardTitle>
                  <CardDescription>
                    Your driver information and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={driver?.profileImage} alt={driver?.name} />
                          <AvatarFallback className="text-lg">
                            {driver?.name?.split(' ').map(n => n[0]).join('') || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{driver?.name}</h3>
                          <p className="text-muted-foreground">{driver?.phone}</p>
                          {driver?.email && (
                            <p className="text-muted-foreground">{driver.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm font-medium">Rating</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                            <span>{driver?.rating}/5</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm font-medium">Total Trips</span>
                          <span>{driver?.totalTrips}</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm font-medium">Experience</span>
                          <span>{driver?.experienceYears} years</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm font-medium">Languages</span>
                          <span>{driver?.languages?.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Recent Performance</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{confirmedBookings.length}</div>
                            <div className="text-sm text-muted-foreground">Confirmed Trips</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{totalEarnings}</div>
                            <div className="text-sm text-muted-foreground">Total Earnings</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
