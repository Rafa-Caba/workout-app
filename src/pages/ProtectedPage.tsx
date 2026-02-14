export function ProtectedPage() {
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Protected</h1>
            <p className="text-sm text-muted-foreground">
                If you can see this, route protection is working.
            </p>
        </div>
    );
}
