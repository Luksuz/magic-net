import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/profile/actions";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export async function ProfileDropdown() {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  // const [user, setUser] = useState<any>(null)
  // const [isAdmin, setIsAdmin] = useState(false)

  // useEffect(() => {
  //   const getUser = async () => {
  //     const { data } = await supabase.auth.getUser();
  //     if (data?.user) {
  //       setUser(data.user);

  //       // Check if user is admin
  //       const { data: profile } = await supabase
  //         .from("profiles")
  //         .select("is_admin")
  //         .eq("user_id", data.user.id)
  //         .single();

  //       setIsAdmin(profile?.is_admin === true);
  //     }
  //   };

  //   getUser();

  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange(async (_event, session) => {
  //     setUser(session?.user || null);

  //     if (session?.user) {
  //       // Check if user is admin
  //       const { data: profile } = await supabase
  //         .from("profiles")
  //         .select("is_admin")
  //         .eq("user_id", session.user.id)
  //         .single();

  //       setIsAdmin(profile?.is_admin === true);
  //     } else {
  //       setIsAdmin(false);
  //     }
  //   });

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, [supabase]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Prijava
      </Link>
    );
  }

  const { data: profile } = await (await supabase)
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();
  const isAdmin = profile?.is_admin === true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 px-2"
        >
          <UserCircle className="h-5 w-5" />
          <span className="hidden sm:inline-block">
            {user.email?.split("@")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Moj račun</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>Profil</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <button className="flex items-center gap-2 cursor-pointer w-full text-left">
              <LogOut className="h-4 w-4" />
              <span>Odjava</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
