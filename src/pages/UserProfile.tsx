import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ImageCropper from "../components/ImageCropper";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
});

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profileData = await supabaseService.getUserProfile(user.id);
        
        if (profileData) {
          setProfile(profileData);
          setAvatarUrl(profileData.profile_pic);
          form.reset({ 
            name: profileData.name || user.user_metadata?.name || "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast.error("Erro ao carregar seu perfil. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const updatedProfile = await supabaseService.updateUserProfile({
        id: user.id,
        name: values.name,
        profile_pic: avatarUrl
      });
        
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast.success("Perfil atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao salvar o perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    if (!user) return;
    
    try {
      setIsUploading(true);
      
      // Converter o Blob para File
      const file = new File([croppedImage], 'profile-picture.jpg', {
        type: 'image/jpeg',
      });
      
      const publicUrl = await supabaseService.uploadAvatar(user.id, file);
        
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        
        await supabaseService.updateUserProfile({
          id: user.id,
          profile_pic: publicUrl
        });
        
        toast.success("Avatar atualizado com sucesso!");
      }
      
    } catch (error) {
      console.error("Erro ao enviar avatar:", error);
      toast.error("Erro ao enviar sua imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      toast.error("Erro ao sair. Tente novamente.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Perfil" showBackButton />
        <div className="flex justify-center items-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="Meu Perfil" showBackButton />
      <main className="flex-1 p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Atualize seus dados pessoais</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback>
                    {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="bg-primary text-white p-2 rounded-full">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </div>
                  </Label>
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    disabled={isUploading}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" onClick={handleLogout}>
              Sair da conta
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      {selectedFile && (
        <ImageCropper
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
          onCropComplete={handleCropComplete}
          imageFile={selectedFile}
        />
      )}
      
      <BottomNav />
    </div>
  );
};

export default UserProfile;
