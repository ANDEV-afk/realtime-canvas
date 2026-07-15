"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkspaceSettingsFormProps {
  workspace: { id: string; name: string; slug: string };
}

export function WorkspaceSettingsForm({ workspace }: WorkspaceSettingsFormProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const name = form.get("name") as string;
          if (!name?.trim()) return;
          const res = await fetch(`/api/workspaces/${workspace.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (res.ok) {
            router.push(`/workspace/${workspace.slug}`);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Workspace name</Label>
          <Input id="name" name="name" defaultValue={workspace.name} required />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={workspace.slug} disabled />
        </div>
        <Button type="submit">Save changes</Button>
      </form>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting this workspace will permanently remove all boards and data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete workspace</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{workspace.name}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const res = await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
                  if (res.ok) router.push("/workspace");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
