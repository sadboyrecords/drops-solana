/* eslint-disable @typescript-eslint/ban-ts-comment */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/react-hook-form/form";
import { useSession } from "next-auth/react";
import {
  PopoverContent,
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Trash2Icon as TrashIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useFieldArray } from "react-hook-form";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { toast } from "react-toastify";
import Spinner from "@/components/svg/Spinner";
import { useCallback, useMemo, useState } from "react";
import { dropSchema } from "@/lib/schemaValidations/DropSchema";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import { routes } from "@/lib/constants";
import type { DropSchemaType } from "@/lib/schemaValidations/DropSchema";

const storage = new ThirdwebStorage();

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

function NewDropForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const form = useForm<z.infer<typeof dropSchema>>({
    resolver: zodResolver(dropSchema),
    defaultValues: {
      // Have to add default values here or react will throw an error.React is seeing it going from undefined to a value.
      name: "",
      symbol: "",
      sellerFeeBasisPoints: "",
      itemsAvailable: "",
      description: "",
      defaultGuard: {
        paymentDestination: session?.user?.walletAddress,
        price: "",
        startTime: "12:00",
        endTime: "12:00",
      },
      creatorSplits: [
        {
          address: "",
          share: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "creatorSplits",
  });

  const {
    fields: guardFields,
    append: appenGuards,
    remove: removeGuards,
  } = useFieldArray({
    control: form.control,
    name: "guards",
  });

  const creatorSplits = form.watch("creatorSplits");
  const image = form.watch("dropImage");
  const audio = form.watch("audioFile");

  const getfullDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes
    );
  };

  const saveMutation = api.drop.createDrop.useMutation();
  const updateMutation = api.drop.updateDrop.useMutation();

  const [imageChanged, setImageChanged] = useState(false);
  const [audioChanged, setAudioChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { query } = useRouter();
  const { data: drop } = api.drop.getDraft.useQuery(query?.slug as string, {
    enabled: !!query?.slug,
    staleTime: 1000 * 3, // 3 seconds
  });

  const createFileFromUrl = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const fileName = url.split("/").pop();
    const file = new File([blob], fileName || "name", { type: blob.type });

    return {
      file,
      fileName,
    };
  };

  const [loadedForm, setLoadedForm] = useState(false);
  const resetFormWithDrop = useCallback(
    async (drop: DropSchemaType) => {
      const imageUrl = storage.resolveScheme(drop.imageIpfsHash);
      // console.log({ imageUrl });
      const image = await createFileFromUrl(imageUrl);

      let audioFile: File | undefined;
      if (drop.audioIpfsHash) {
        const audioUrl = storage.resolveScheme(drop.audioIpfsHash);
        audioFile = (await createFileFromUrl(audioUrl)).file;
      }
      form.reset({
        ...drop,
        dropImage: image.file,
        audioFile,
        defaultGuard: {
          ...drop.defaultGuard,
          startDate: new Date(drop.defaultGuard.startDate),
          endDate: drop.defaultGuard.endDate
            ? new Date(drop.defaultGuard.endDate)
            : undefined,
        },
        guards: drop.guards?.map((guard) => ({
          ...guard,
          startDate: guard.startDate ? new Date(guard.startDate) : undefined,
          endDate: guard.endDate ? new Date(guard.endDate) : undefined,
        })),
      });
      setLoadedForm(true);
    },
    [form]
  );

  useMemo(() => {
    if (drop && !loadedForm) {
      const formSubmission = drop.formSubmission as unknown as DropSchemaType;

      void resetFormWithDrop(formSubmission);
    }
  }, [drop, resetFormWithDrop, loadedForm]);

  const onSubmit = async (data: z.infer<typeof dropSchema>) => {
    try {
      setIsSubmitting(true);
      const startDateTime = getfullDateTime(
        data.defaultGuard.startDate,
        data.defaultGuard.startTime
      );
      let endtDateTime: Date | undefined;
      if (data.defaultGuard.endDate) {
        endtDateTime = getfullDateTime(
          data.defaultGuard.endDate,
          data.defaultGuard.endTime
        );
      }
      let imageHash: string | undefined;
      if (
        (drop?.imageIpfsHash && imageChanged) ||
        !drop ||
        !drop?.imageIpfsHash
      ) {
        imageHash = await storage.upload(data.dropImage, {
          uploadWithoutDirectory: true,
        });
      } else {
        imageHash = drop?.imageIpfsHash;
      }

      let audioHash: string | undefined;
      if (drop?.audioIpfsHash) {
        audioHash = drop?.audioIpfsHash;
      }
      if (data.audioFile && audioChanged) {
        audioHash = await storage.upload(data.audioFile, {
          uploadWithoutDirectory: true,
        });
      }
      let saved;

      if (drop) {
        saved = await updateMutation.mutateAsync({
          slug: drop.slug,
          drop: {
            ...data,
            imageIpfsHash: imageHash,
            audioIpfsHash: audioHash,
            defaultGuard: {
              ...data.defaultGuard,
              startDate: startDateTime,
              endDate: endtDateTime,
            },
            guards: data.guards?.map((guard) => ({
              ...guard,
              startDate: guard?.startDate
                ? getfullDateTime(guard?.startDate, guard.startTime)
                : undefined,
              endDate: guard?.endDate
                ? getfullDateTime(guard.endDate, guard.endTime)
                : undefined,
            })),
          },
        });
      }
      if (!drop) {
        saved = await saveMutation.mutateAsync({
          ...data,
          imageIpfsHash: imageHash,
          audioIpfsHash: audioHash,
          defaultGuard: {
            ...data.defaultGuard,
            startDate: startDateTime,
            endDate: endtDateTime,
          },
          guards: data.guards?.map((guard) => ({
            ...guard,
            startDate: guard?.startDate
              ? getfullDateTime(guard?.startDate, guard.startTime)
              : undefined,
            endDate: guard?.endDate
              ? getfullDateTime(guard.endDate, guard.endTime)
              : undefined,
          })),
        });
      }
      if (saved?.slug) {
        await router.push(routes.draftDrops(saved.slug).href);
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error("There was an error saving this drop");
    }
    // return true;
  };

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-10"
      >
        {/* Basic Drop Information  */}
        <div className="rounded-2xl bg-white p-4">
          <div>
            <p className="text-lg font-semibold">Basic Information</p>
          </div>
          {/* FORM FIELDS */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/*  */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drop/Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GMG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellerFeeBasisPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalties</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    The percentage of royalties you want to receive from
                    secondary sales. We recommend no more than 10%.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemsAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total NFTs</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    The max amount of NFTs you would like to include in this
                    drop.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-1 sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dropImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>

                  <FormControl>
                    <Input
                      id="dropImage"
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      max={MAX_FILE_SIZE}
                      {...field}
                      // @ts-ignore
                      value={field?.value?.filename as string}
                      onChange={(event) => {
                        // @ts-ignore
                        field.onChange(event?.target?.files[0]);
                        setImageChanged(true);
                      }}
                    />
                  </FormControl>
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(image)}
                      className="mt-2 h-32 w-32 rounded-lg"
                      alt="nft image"
                    />
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audioFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio File (optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="audioFile"
                      type="file"
                      accept={"audio/*"}
                      max={MAX_FILE_SIZE}
                      {...field}
                      // @ts-ignore
                      value={field?.value?.filename as string}
                      onChange={(event) => {
                        // @ts-ignore
                        field.onChange(event?.target?.files[0]);
                        setAudioChanged(true);
                      }}
                    />
                  </FormControl>
                  {audio && (
                    <audio
                      controls
                      src={URL.createObjectURL(audio)}
                      // alt=""
                      className="h-[3.75rem] w-[12.5rem]"
                    />
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --CREATOR SPLITS == */}
        <div className="rounded-2xl bg-white p-4">
          <div className="">
            <p className="text-lg font-semibold">Creator Splits</p>
            <FormDescription>
              The percentage of royalties you want to receive from secondary
            </FormDescription>
          </div>
          <div className="mt-4 space-y-4">
            {fields.map((field, index) => (
              <div key={field.address} className="flex items-end space-x-2">
                <div className="basis-5/6">
                  <FormField
                    control={form.control}
                    name={`creatorSplits.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name={`creatorSplits.${index}.share`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Button
                    variant="ghost"
                    disabled={creatorSplits.length < 2}
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="h-4 w-4 " />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                append({
                  address: "",
                  share: "",
                });
              }}
            >
              Add another Wallet
            </Button>
          </div>
        </div>

        {/* DEFAULT SETTINGS */}
        <div className="rounded-2xl bg-white p-4">
          <div>
            <p className="text-lg font-semibold">Default Settings</p>
            <FormDescription>
              The default settings for your drop. You can add more guards below.
            </FormDescription>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultGuard.price"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Sale Price</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    The amount you want to sell each NFT for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultGuard.paymentDestination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Wallet Address </FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    The wallet all sales should go to. By default it is set to
                    your wallet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="">
              <FormLabel>Start Date</FormLabel>
              <div className="mb-1 mt-2 flex flex-wrap items-center gap-3">
                <FormField
                  control={form.control}
                  name="defaultGuard.startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[13rem] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date as Date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultGuard.startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                The date you want this drop to start
              </FormDescription>
            </div>

            <div className="">
              <FormLabel>End Date</FormLabel>
              <div className="mb-1 mt-2 flex flex-wrap items-center gap-3">
                <FormField
                  control={form.control}
                  name="defaultGuard.endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[13rem] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date as Date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultGuard.endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="time" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                The date you want this drop to end.
              </FormDescription>
            </div>
          </div>
        </div>

        {/* GUARDS */}
        <div className="rounded-2xl bg-white p-4">
          <div>
            <p className="text-lg font-semibold">Guards</p>
            <FormDescription>
              Guards are rules that you can set for your drop. You can add as
              many as you want.
            </FormDescription>
          </div>

          <div className="flex flex-col divide-y divide-gray-300 ">
            {guardFields.map((field, index) => (
              <div
                key={field.label}
                className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name={`guards.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of this guard. Cannot be more than 6
                        characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`guards.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        The amount you want to sell each NFT for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`guards.${index}.paymentDestination`}
                  render={({ field }) => (
                    <FormItem className="col-span-1 sm:col-span-2">
                      <FormLabel>Destination Wallet Address </FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        The wallet all sales should go to. By default it is set
                        to your wallet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="">
                  <FormLabel>Start Date</FormLabel>
                  <div className="mb-1 mt-2 flex flex-wrap items-center gap-3">
                    <FormField
                      control={form.control}
                      name={`guards.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[13rem] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) =>
                                  field.onChange(date as Date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`guards.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="time" placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>
                    The date you want this drop to start
                  </FormDescription>
                </div>

                <div className="">
                  <FormLabel>End Date</FormLabel>
                  <div className="mb-1 mt-2 flex flex-wrap items-center gap-3">
                    <FormField
                      control={form.control}
                      name={`guards.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[13rem] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) =>
                                  field.onChange(date as Date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`guards.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="time" placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>
                    The date you want this drop to end.
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name={`guards.${index}.mintLimit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mint Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        The Mint Limit allows specifying a limit on the number
                        of NFTs each wallet can mint (Must be greater than 0).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`guards.${index}.redeemAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redeem Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>
                        The Redeemed Amount forbids minting when the number of
                        minted NFTs for the entire Drop reaches the configured
                        maximum amount (Must be greater than 0).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => removeGuards(index)}
                  >
                    Remove Guard
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                appenGuards({
                  label: "",
                  paymentDestination: session?.user?.walletAddress || "",
                  price: "",
                  startTime: "12:00",
                  endTime: "12:00",
                  mintLimit: "",
                  redeemAmount: "",
                });
              }}
            >
              Add a new Guard
            </Button>
          </div>
        </div>

        <div className="space-x-4">
          <Button onClick={() => router.back()} type="button" variant="outline">
            Back
          </Button>
          <Button type="submit">{isSubmitting ? <Spinner /> : "Save"}</Button>
        </div>
      </form>
    </Form>
  );
}

export default NewDropForm;
