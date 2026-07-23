export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          display_name_normalized: string | null;
          display_name_changed_at: string;
          avatar_url: string | null;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          display_name_normalized?: string | null;
          display_name_changed_at?: string;
          avatar_url?: string | null;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          display_name_normalized?: string | null;
          display_name_changed_at?: string;
          avatar_url?: string | null;
          is_private?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          provider: string;
          provider_game_id: string;
          slug: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          background_image_url: string | null;
          release_date: string | null;
          developer: string | null;
          publisher: string | null;
          external_rating: number | null;
          estimated_playtime: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider: string;
          provider_game_id: string;
          slug: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          background_image_url?: string | null;
          release_date?: string | null;
          developer?: string | null;
          publisher?: string | null;
          external_rating?: number | null;
          estimated_playtime?: number | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
      };
      genres: {
        Row: { id: string; name: string; slug: string };
        Insert: { name: string; slug: string };
        Update: { name?: string; slug?: string };
        Relationships: [];
      };
      platforms: {
        Row: { id: string; name: string; slug: string };
        Insert: { name: string; slug: string };
        Update: { name?: string; slug?: string };
        Relationships: [];
      };
      game_genres: {
        Row: { game_id: string; genre_id: string };
        Insert: { game_id: string; genre_id: string };
        Update: never;
        Relationships: [];
      };
      game_platforms: {
        Row: { game_id: string; platform_id: string };
        Insert: { game_id: string; platform_id: string };
        Update: never;
        Relationships: [];
      };
      user_games: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          status: Database["public"]["Enums"]["game_status"];
          is_favorite: boolean;
          finished: boolean | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          status: Database["public"]["Enums"]["game_status"];
          is_favorite?: boolean;
          finished?: boolean | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          status?: Database["public"]["Enums"]["game_status"];
          is_favorite?: boolean;
          finished?: boolean | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          overall_rating: number;
          story_rating: number | null;
          gameplay_rating: number | null;
          visuals_rating: number | null;
          soundtrack_rating: number | null;
          difficulty_rating: number | null;
          would_recommend: boolean | null;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          overall_rating: number;
          story_rating?: number | null;
          gameplay_rating?: number | null;
          visuals_rating?: number | null;
          soundtrack_rating?: number | null;
          difficulty_rating?: number | null;
          would_recommend?: boolean | null;
          review?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>;
        Relationships: [];
      };
      discovery_interactions: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          action: Database["public"]["Enums"]["discovery_action"];
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          action: Database["public"]["Enums"]["discovery_action"];
        };
        Update: never;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          activity_type: Database["public"]["Enums"]["activity_type"];
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          activity_type: Database["public"]["Enums"]["activity_type"];
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_user_id: string;
          actor_user_id: string | null;
          game_id: string | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          link_href: string | null;
          read_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          recipient_user_id: string;
          actor_user_id?: string | null;
          game_id?: string | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string;
          link_href?: string | null;
          read_at?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          read_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      game_status:
        | "played"
        | "playing"
        | "want_to_play"
        | "dropped"
        | "not_interested"
        | "skipped";
      discovery_action:
        | "played"
        | "playing"
        | "want_to_play"
        | "dropped"
        | "not_interested"
        | "skipped"
        | "favorite"
        | "unfavorite";
      activity_type: "status_changed" | "rating_saved" | "favorite_changed";
      notification_type: "followed_you" | "reaction" | "comment" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
}
