from __future__ import annotations

import os
from typing import Any, Optional

from supabase import Client, create_client


class SupabaseService:
    def __init__(self, url: str, anon_key: str, service_role_key: str | None = None) -> None:
        # Auth calls should use anon key.
        self.auth_client: Client = create_client(url, anon_key)
        # Use anon_key for general data operations to ensure public access works.
        # Authenticated requests will still work if the user token is provided.
        self.data_client: Client = create_client(url, anon_key)

    @classmethod
    def from_env(cls):
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not anon_key:
            print(f"Supabase configuration missing: URL={bool(url)}, Key={bool(anon_key)}")
            return None
            
        return cls(url, anon_key, service_role_key)

    def sign_up(self, email: str, password: str, full_name: str | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"email": email, "password": password}
        if full_name:
            payload["options"] = {"data": {"full_name": full_name}}

        result = self.auth_client.auth.sign_up(payload)
        user = result.user
        session = result.session

        # Auto-confirm if service role is available and session wasn't returned (meaning confirmation is required)
        if user and not session and hasattr(self.data_client.auth, "admin"):
            try:
                self.data_client.auth.admin.update_user_by_id(user.id, {"email_confirm": True})
                # Re-authenticate to get the session
                res2 = self.auth_client.auth.sign_in_with_password({"email": email, "password": password})
                session = res2.session
            except Exception:
                pass

        return {
            "user": {
                "id": user.id if user else None,
                "email": getattr(user, "email", email),
                "full_name": (user.user_metadata or {}).get("full_name") if user else full_name,
            },
            "access_token": session.access_token if session else None,
            "refresh_token": session.refresh_token if session else None,
        }

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        try:
            result = self.auth_client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            user = result.user
            session = result.session
        except Exception as e:
            # Handle unconfirmed email for existing users seamlessly
            if "Email not confirmed" in str(e) and hasattr(self.data_client.auth, "admin"):
                # Try to auto-confirm them
                try:
                    # We need the user ID. We can search users or just assume we can't easily auto-confirm 
                    # without the ID. But wait, admin.list_users() is an option.
                    # Or we just let it fail. Wait! We can use admin.generate_link to get the user, or 
                    # use admin.list_users to find them.
                    users_resp = self.data_client.auth.admin.list_users()
                    target_user = next((u for u in users_resp if getattr(u, "email", "") == email), None)
                    if target_user:
                        self.data_client.auth.admin.update_user_by_id(target_user.id, {"email_confirm": True})
                        # Retry sign in
                        result = self.auth_client.auth.sign_in_with_password({"email": email, "password": password})
                        user = result.user
                        session = result.session
                    else:
                        raise e
                except Exception:
                    raise e
            else:
                raise e

        return {
            "user": {
                "id": user.id if user else None,
                "email": getattr(user, "email", email),
                "full_name": (user.user_metadata or {}).get("full_name") if user else None,
            },
            "access_token": session.access_token if session else None,
            "refresh_token": session.refresh_token if session else None,
        }

    def resend_confirmation(self, email: str) -> bool:
        # Supabase Python client doesn't have a direct 'resend' method in all versions, 
        # but sign_up often triggers it if the user is unconfirmed.
        # Alternatively, we use the 'resend' method if available in the GoTrue client.
        try:
            self.auth_client.auth.resend({"type": "signup", "email": email})
            return True
        except Exception:
            # Fallback or handle error
            return False

    def list_products(self, limit: int = 200) -> list[dict[str, Any]]:
        query = self.data_client.table("products").select("*").limit(limit)
        response = query.execute()
        return response.data or []

    def create_product(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.data_client.table("products").insert(payload).execute()
        if not response.data:
            raise RuntimeError("Product insert failed")
        return response.data[0]

    def get_user_from_token(self, access_token: str) -> dict[str, Any]:
        result = self.auth_client.auth.get_user(access_token)
        user = result.user
        if not user:
            raise RuntimeError("Invalid or expired token")
        return {
            "id": user.id,
            "email": getattr(user, "email", None),
        }

    def list_room_projects(self, user_id: str, limit: int = 20) -> list[dict[str, Any]]:
        response = (
            self.data_client.table("room_projects")
            .select("id,name,theme,room_data,furniture_data,notes,created_at,updated_at")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    def create_room_project(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        body = {
            "user_id": user_id,
            "name": payload.get("name", "Untitled Project"),
            "theme": payload.get("theme", "modern"),
            "room_data": payload.get("room_data", {}),
            "furniture_data": payload.get("furniture_data", []),
            "notes": payload.get("notes", ""),
        }
        response = self.data_client.table("room_projects").insert(body).execute()
        if not response.data:
            raise RuntimeError("Project insert failed")
        return response.data[0]

    def get_room_project(self, user_id: str, project_id: str) -> dict[str, Any] | None:
        response = (
            self.data_client.table("room_projects")
            .select("id,name,theme,room_data,furniture_data,notes,created_at,updated_at")
            .eq("user_id", user_id)
            .eq("id", project_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    def update_room_project(self, user_id: str, project_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        patch: dict[str, Any] = {}
        for key in ("name", "theme", "room_data", "furniture_data", "notes"):
            if key in payload and payload[key] is not None:
                patch[key] = payload[key]

        if not patch:
            return self.get_room_project(user_id, project_id)

        response = (
            self.data_client.table("room_projects")
            .update(patch)
            .eq("user_id", user_id)
            .eq("id", project_id)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None

    def delete_room_project(self, user_id: str, project_id: str) -> bool:
        response = (
            self.data_client.table("room_projects")
            .delete()
            .eq("user_id", user_id)
            .eq("id", project_id)
            .execute()
        )
        return bool(response.data)

    def register_professional(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.data_client.table("professionals").insert(payload).execute()
        if not response.data:
            raise RuntimeError("Professional insert failed")
        return response.data[0]

    def get_professionals(self, city: str, profession: Optional[str] = None, sort_by: str = "rating") -> list[dict[str, Any]]:
        query = self.data_client.table("professionals").select("*").ilike("city", f"%{city.strip()}%")
        if profession:
            query = query.eq("profession", profession)
            
        if sort_by == "rating":
            query = query.order("rating", desc=True)
        elif sort_by == "price_low":
            query = query.order("visiting_charge_inr")
        elif sort_by == "price_high":
            query = query.order("visiting_charge_inr", desc=True)
        elif sort_by == "experience":
            query = query.order("experience_years", desc=True)
            
        response = query.execute()
        return response.data or []

    def get_professional_cities(self) -> list[str]:
        response = self.data_client.table("professionals").select("city").execute()
        cities = {row["city"] for row in (response.data or []) if row.get("city")}
        return list(cities)

    def get_professional(self, prof_id: str) -> dict[str, Any] | None:
        response = self.data_client.table("professionals").select("*").eq("id", prof_id).limit(1).execute()
        rows = response.data or []
        return rows[0] if rows else None

    def add_professional_review(self, prof_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        payload["professional_id"] = prof_id
        response = self.data_client.table("professional_reviews").insert(payload).execute()
        if not response.data:
            raise RuntimeError("Review insert failed")
        review = response.data[0]
        
        prof = self.get_professional(prof_id)
        if prof:
            old_count = prof.get("review_count", 0)
            old_rating = float(prof.get("rating", 0.0))
            new_rating = ((old_rating * old_count) + review["rating"]) / (old_count + 1)
            
            self.data_client.table("professionals").update({
                "rating": new_rating,
                "review_count": old_count + 1
            }).eq("id", prof_id).execute()
            
        return review

    def get_professional_reviews(self, prof_id: str) -> list[dict[str, Any]]:
        response = self.data_client.table("professional_reviews").select("*").eq("professional_id", prof_id).order("created_at", desc=True).execute()
        return response.data or []

    def list_furniture_items(self, category: Optional[str] = None, limit: int = 200) -> list[dict[str, Any]]:
        query = self.data_client.table("furniture_items").select("*").limit(limit)
        if category:
            query = query.eq("category", category)
        response = query.execute()
        return response.data or []
