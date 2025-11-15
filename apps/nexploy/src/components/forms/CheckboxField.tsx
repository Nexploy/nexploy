import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from '@workspace/ui/components/form';
import { Checkbox } from '@workspace/ui/components/checkbox';

interface CheckboxFieldProps {
    control: any;
    name: string;
    label: string;
    description: string;
}

export function CheckboxField({ control, name, label, description }: CheckboxFieldProps) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3">
                    <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>{label}</FormLabel>
                        <FormDescription>{description}</FormDescription>
                    </div>
                </FormItem>
            )}
        />
    );
}
