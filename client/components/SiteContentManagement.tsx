import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  Save,
  Globe,
  Users,
  FileText,
  Settings,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

interface FooterContent {
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
  quickLinks: Array<{
    name: string;
    url: string;
  }>;
}

interface TrekGroup {
  id: number;
  title: string;
  fortName: string;
  organizerName: string;
  trekDate: string;
  status: string;
  currentParticipants: number;
  maxParticipants: number;
}

export default function SiteContentManagement() {
  const [footerContent, setFooterContent] = useState<FooterContent>({
    aboutText: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
    },
    quickLinks: [],
  });

  const [trekGroups, setTrekGroups] = useState<TrekGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFooterContent();
    fetchTrekGroups();
  }, []);

  const fetchFooterContent = async () => {
    try {
      const response = await fetch("/api/admin/footer-content");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFooterContent(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching footer content:", error);
    }
  };

  const fetchTrekGroups = async () => {
    try {
      const response = await fetch("/api/trek-groups");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTrekGroups(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching trek groups:", error);
    }
  };

  const updateFooterContent = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/footer-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(footerContent),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Footer content updated successfully",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update footer content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuickLink = () => {
    setFooterContent((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { name: "", url: "" }],
    }));
  };

  const updateQuickLink = (
    index: number,
    field: "name" | "url",
    value: string,
  ) => {
    setFooterContent((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    }));
  };

  const removeQuickLink = (index: number) => {
    setFooterContent((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  const deleteTrekGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/trek-groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setTrekGroups((prev) => prev.filter((group) => group.id !== groupId));
        toast({
          title: "Success",
          description: "Trek group deleted successfully",
        });
      } else {
        throw new Error("Failed to delete trek group");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trek group",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Content Management</h2>
          <p className="text-gray-600">
            Manage dynamic content across your website
          </p>
        </div>
      </div>

      <Tabs defaultValue="footer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="footer">Footer Content</TabsTrigger>
          <TabsTrigger value="trek-groups">Trek Groups</TabsTrigger>
          <TabsTrigger value="pages">Site Pages</TabsTrigger>
        </TabsList>

        {/* Footer Content Management */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Footer Content
              </CardTitle>
              <CardDescription>
                Manage the footer content that appears on all pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aboutText">About Text</Label>
                    <Textarea
                      id="aboutText"
                      value={footerContent.aboutText}
                      onChange={(e) =>
                        setFooterContent((prev) => ({
                          ...prev,
                          aboutText: e.target.value,
                        }))
                      }
                      placeholder="About Nomad Trekkers..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={footerContent.contactEmail}
                      onChange={(e) =>
                        setFooterContent((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                      placeholder="contact@nomadtrekkers.org"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={footerContent.contactPhone}
                      onChange={(e) =>
                        setFooterContent((prev) => ({
                          ...prev,
                          contactPhone: e.target.value,
                        }))
                      }
                      placeholder=""
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={footerContent.address}
                      onChange={(e) =>
                        setFooterContent((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Pune, Maharashtra, India"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Social Media Links</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Facebook URL"
                        value={footerContent.socialLinks.facebook}
                        onChange={(e) =>
                          setFooterContent((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              facebook: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="Twitter URL"
                        value={footerContent.socialLinks.twitter}
                        onChange={(e) =>
                          setFooterContent((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              twitter: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="Instagram URL"
                        value={footerContent.socialLinks.instagram}
                        onChange={(e) =>
                          setFooterContent((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              instagram: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="YouTube URL"
                        value={footerContent.socialLinks.youtube}
                        onChange={(e) =>
                          setFooterContent((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              youtube: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Quick Links</Label>
                      <Button
                        onClick={addQuickLink}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {footerContent.quickLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Link Name"
                            value={link.name}
                            onChange={(e) =>
                              updateQuickLink(index, "name", e.target.value)
                            }
                          />
                          <Input
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) =>
                              updateQuickLink(index, "url", e.target.value)
                            }
                          />
                          <Button
                            onClick={() => removeQuickLink(index)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateFooterContent} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Footer Content"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trek Groups Management */}
        <TabsContent value="trek-groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trek Groups Management
              </CardTitle>
              <CardDescription>
                View and manage user-created trek groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trekGroups.length > 0 ? (
                <div className="space-y-4">
                  {trekGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{group.title}</h3>
                          <p className="text-sm text-gray-600">
                            {group.fortName} • Organized by{" "}
                            {group.organizerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(group.trekDate).toLocaleDateString()} •
                            {group.currentParticipants}/{group.maxParticipants}{" "}
                            participants
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              group.status === "open"
                                ? "bg-green-100 text-green-800"
                                : group.status === "full"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {group.status.toUpperCase()}
                          </span>
                          <Button
                            onClick={() => deleteTrekGroup(group.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No trek groups yet
                  </h3>
                  <p className="text-gray-600">
                    Trek groups created by users will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Pages Management */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Site Pages
              </CardTitle>
              <CardDescription>
                Manage dynamic pages and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Coming Soon
                </h3>
                <p className="text-gray-600">
                  Dynamic page management will be available in the next update
                </p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
